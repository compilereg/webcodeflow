package utilities;

import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import org.junit.jupiter.api.Test;
import java.io.File;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class ValidationResultTest {

    @Test
    public void testValidationResult() {
        ValidationResult vr = new ValidationResult();
        assertFalse(vr.hasErrors());
        assertTrue(vr.getErrors().isEmpty());

        vr.addError("Error 1");
        assertTrue(vr.hasErrors());
        assertEquals(1, vr.getErrors().size());
        assertEquals("Error 1", vr.getErrors().get(0));

        // Test ignored null/empty errors
        vr.addError(null);
        vr.addError("   ");
        assertEquals(1, vr.getErrors().size());

        // Unmodifiable list check
        List<String> errs = vr.getErrors();
        assertThrows(UnsupportedOperationException.class, () -> {
            errs.add("Attempt modification");
        });
    }

    @Test
    public void testFileDecodeResult() {
        FileDecodeResult result = new FileDecodeResult();
        assertNull(result.getOriginalFileName());
        assertNull(result.getFileBytes());
        assertNull(result.getSourceText());
        assertNull(result.getTempFile());

        byte[] bytes = new byte[]{1, 2, 3};
        File mockFile = mock(File.class);

        result.setOriginalFileName("main.cpp");
        result.setFileBytes(bytes);
        result.setSourceText("content");
        result.setTempFile(mockFile);

        assertEquals("main.cpp", result.getOriginalFileName());
        assertSame(bytes, result.getFileBytes());
        assertEquals("content", result.getSourceText());
        assertSame(mockFile, result.getTempFile());
    }

    @Test
    public void testMultiFileDecodeResult() {
        MultiFileDecodeResult result = new MultiFileDecodeResult();
        assertNull(result.getMainTempFile());
        assertNull(result.getMainOriginalFileName());
        assertNull(result.getMainFileBytes());
        assertTrue(result.getAdditionalTempFiles().isEmpty());
        assertTrue(result.getAdditionalOriginalFileNames().isEmpty());

        File mainFile = mock(File.class);
        byte[] mainBytes = new byte[]{4, 5};

        result.setMainTempFile(mainFile);
        result.setMainOriginalFileName("main.py");
        result.setMainFileBytes(mainBytes);

        assertSame(mainFile, result.getMainTempFile());
        assertEquals("main.py", result.getMainOriginalFileName());
        assertSame(mainBytes, result.getMainFileBytes());

        File additionalFile = mock(File.class);
        result.getAdditionalTempFiles().add(additionalFile);
        result.getAdditionalOriginalFileNames().add("utils.py");

        assertEquals(1, result.getAdditionalTempFiles().size());
        assertSame(additionalFile, result.getAdditionalTempFiles().get(0));
        assertEquals(1, result.getAdditionalOriginalFileNames().size());
        assertEquals("utils.py", result.getAdditionalOriginalFileNames().get(0));
    }

    @Test
    public void testSubmitRunValidationResult() {
        SubmitRunValidationResult result = new SubmitRunValidationResult();
        assertNull(result.getProblem());
        assertNull(result.getLanguage());

        IProblem mockProblem = mock(IProblem.class);
        ILanguage mockLanguage = mock(ILanguage.class);

        result.setProblem(mockProblem);
        result.setLanguage(mockLanguage);

        assertSame(mockProblem, result.getProblem());
        assertSame(mockLanguage, result.getLanguage());
    }
}
