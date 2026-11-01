package utilities;

import org.junit.jupiter.api.Test;
import Model.SubmissionFileRequest;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class FileUtilityTest {

    @Test
    public void testDecodeAndCreateTempFileEmptyInputs() {
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("", "");
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("File name cannot be empty."));
        assertTrue(res.getErrors().contains("File content cannot be empty."));
    }

    @Test
    public void testDecodeAndCreateTempFileUnsupportedExtension() {
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("test.txt", "cHJpbnQoImhlbGxvIikK");
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("File extension is not supported. Allowed: .c, .cpp, .java, .py"));
    }

    @Test
    public void testDecodeAndCreateTempFileInvalidBase64() {
        // "???" is invalid base64
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("Main.java", "???");
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("fileContentBase64 is not valid Base64."));
    }

    @Test
    public void testDecodeAndCreateTempFileNonCanonicalBase64() {
        // Base64 encoding with non-canonical representation of valid bytes (e.g. QT== which decodes to 'A' but re-encodes to QQ==)
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("Main.java", "QT==");
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("fileContentBase64 is not in valid canonical Base64 form."));
    }


    @Test
    public void testDecodeAndCreateTempFileInvalidUtf8() {
        // 0xFF 0xFE is not valid UTF-8
        byte[] bytes = new byte[] { (byte)0xFF, (byte)0xFE };
        String base64 = Base64.getEncoder().encodeToString(bytes);
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("Main.java", base64);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Decoded file content is not valid UTF-8 text."));
    }

    @Test
    public void testDecodeAndCreateTempFileDisallowedControlChars() {
        // Backspace character \b (ASCII 8) is disallowed control char
        byte[] bytes = "public class Main { \b }".getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("Main.java", base64);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Decoded source file contains invalid control characters."));
    }

    @Test
    public void testDecodeAndCreateTempFilePythonUnsupportedChar() {
        // A character like '?' in Python code is unsupported in our strict validator rules
        byte[] bytes = "print(\"?\")".getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("main.py", base64);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().stream().anyMatch(e -> e.contains("Python source contains unsupported character")));
    }

    @Test
    public void testDecodeAndCreateTempFilePythonUnbalancedBrackets() {
        // Unbalanced brackets
        byte[] bytes = "print(\"hello\"".getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("main.py", base64);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Python source contains unbalanced brackets."));
    }

    @Test
    public void testDecodeAndCreateTempFilePythonTrailingOperator() {
        // Trailing operator '+'
        byte[] bytes = "x = 5 +".getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("main.py", base64);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Python source ends with an invalid trailing operator or symbol."));
    }

    @Test
    public void testDecodeAndCreateTempFileSuccess() throws IOException {
        String code = "public class Main {\n    public static void main(String[] args) {}\n}";
        String base64 = Base64.getEncoder().encodeToString(code.getBytes());
        FileDecodeResult res = FileUtility.decodeAndCreateTempFile("Main.java", base64);
        
        assertFalse(res.hasErrors());
        assertEquals("Main.java", res.getOriginalFileName());
        assertEquals(code, res.getSourceText());
        assertNotNull(res.getTempFile());
        assertTrue(res.getTempFile().exists());

        // Verify content written to disk
        String fileContent = new String(Files.readAllBytes(res.getTempFile().toPath()));
        assertEquals(code, fileContent);

        // Cleanup
        assertTrue(res.getTempFile().delete());
    }

    @Test
    public void testDecodeSubmissionFilesSuccessAndCleanup() throws IOException {
        String mainCode = "public class Main {}";
        String mainBase64 = Base64.getEncoder().encodeToString(mainCode.getBytes());
        SubmissionFileRequest mainReq = new SubmissionFileRequest();
        mainReq.setFileName("Main.java");
        mainReq.setFileContentBase64(mainBase64);

        String addCode = "public class Add {}";
        String addBase64 = Base64.getEncoder().encodeToString(addCode.getBytes());
        SubmissionFileRequest addReq = new SubmissionFileRequest();
        addReq.setFileName("Add.java");
        addReq.setFileContentBase64(addBase64);

        List<SubmissionFileRequest> additionals = new ArrayList<>();
        additionals.add(addReq);

        MultiFileDecodeResult multiRes = FileUtility.decodeSubmissionFiles(mainReq, additionals);
        assertFalse(multiRes.hasErrors());
        assertNotNull(multiRes.getMainTempFile());
        assertEquals(1, multiRes.getAdditionalTempFiles().size());
        assertTrue(multiRes.getMainTempFile().exists());
        assertTrue(multiRes.getAdditionalTempFiles().get(0).exists());

        // Cleanup
        FileUtility.cleanupSubmissionFiles(multiRes);
        assertFalse(multiRes.getMainTempFile().exists());
        assertFalse(multiRes.getAdditionalTempFiles().get(0).exists());
    }

    @Test
    public void testDecodeSubmissionFilesDuplicateNames() {
        String mainCode = "public class Main {}";
        String mainBase64 = Base64.getEncoder().encodeToString(mainCode.getBytes());
        SubmissionFileRequest mainReq = new SubmissionFileRequest();
        mainReq.setFileName("Main.java");
        mainReq.setFileContentBase64(mainBase64);

        SubmissionFileRequest addReq = new SubmissionFileRequest();
        addReq.setFileName("main.java"); // duplicate name (case insensitive)
        addReq.setFileContentBase64(mainBase64);

        List<SubmissionFileRequest> additionals = new ArrayList<>();
        additionals.add(addReq);

        MultiFileDecodeResult multiRes = FileUtility.decodeSubmissionFiles(mainReq, additionals);
        assertTrue(multiRes.hasErrors());
        assertTrue(multiRes.getErrors().stream().anyMatch(e -> e.contains("Duplicate file name detected")));

        // Cleanup any partial files
        FileUtility.cleanupSubmissionFiles(multiRes);
    }
}
