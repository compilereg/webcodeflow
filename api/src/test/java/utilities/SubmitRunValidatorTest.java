package utilities;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import Model.SubmissionFileRequest;
import Model.SubmitRunRequest;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IContestClock;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class SubmitRunValidatorTest {

    @Test
    public void testValidateNullRequest() {
        IContest mockContest = mock(IContest.class);
        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, null);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Request body is missing or invalid."));
    }

    @Test
    public void testValidateNullContest() {
        SubmitRunRequest req = new SubmitRunRequest();
        SubmitRunValidationResult res = SubmitRunValidator.validate(null, req);
        assertTrue(res.hasErrors());
        assertTrue(res.getErrors().contains("Unable to retrieve contest data."));
    }

    @Test
    public void testValidateContestClockNotRunning() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(false); // stopped
        when(mockContest.getContestClock()).thenReturn(mockClock);

        SubmitRunRequest req = new SubmitRunRequest();
        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertTrue(res.getErrors().contains("Submissions cannot be made while the contest is stopped or paused."));
    }

    @Test
    public void testValidateEmptyNamesAndFiles() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        SubmitRunRequest req = new SubmitRunRequest();
        req.setProblemName("");
        req.setLanguageName("  ");
        req.setMainFile(null);

        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertTrue(res.getErrors().contains("Problem name cannot be empty."));
        assertTrue(res.getErrors().contains("Language name cannot be empty."));
        assertTrue(res.getErrors().contains("Main file is required."));
    }

    @Test
    public void testValidateMainFileEmptyFields() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        SubmitRunRequest req = new SubmitRunRequest();
        req.setProblemName("A");
        req.setLanguageName("Java");
        
        SubmissionFileRequest mainFile = new SubmissionFileRequest();
        mainFile.setFileName("");
        mainFile.setFileContentBase64("  ");
        req.setMainFile(mainFile);

        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertTrue(res.getErrors().contains("Main file name cannot be empty."));
        assertTrue(res.getErrors().contains("Main file content cannot be empty."));
    }

    @Test
    public void testValidateAdditionalFilesErrors() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        SubmitRunRequest req = new SubmitRunRequest();
        req.setProblemName("A");
        req.setLanguageName("Java");

        SubmissionFileRequest mainFile = new SubmissionFileRequest();
        mainFile.setFileName("Main.java");
        mainFile.setFileContentBase64("cHJpbnQoImhlbGxvIikK");
        req.setMainFile(mainFile);

        List<SubmissionFileRequest> additionals = new ArrayList<>();
        additionals.add(null); // null file at index 0

        SubmissionFileRequest addFile1 = new SubmissionFileRequest();
        addFile1.setFileName(""); // empty name at index 1
        addFile1.setFileContentBase64("cHJpbnQoImhlbGxvIikK");
        additionals.add(addFile1);

        SubmissionFileRequest addFile2 = new SubmissionFileRequest();
        addFile2.setFileName("Helper.java");
        addFile2.setFileContentBase64(""); // empty content
        additionals.add(addFile2);

        SubmissionFileRequest addFile3 = new SubmissionFileRequest();
        addFile3.setFileName("Main.java"); // duplicate name (matching main file)
        addFile3.setFileContentBase64("cHJpbnQoImhlbGxvIikK");
        additionals.add(addFile3);

        req.setAdditionalFiles(additionals);

        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertTrue(res.getErrors().contains("Additional file at index 0 is invalid."));
        assertTrue(res.getErrors().contains("Additional file at index 1 has empty file name."));
        assertTrue(res.getErrors().contains("Additional file 'Helper.java' has empty content."));
        assertTrue(res.getErrors().contains("Duplicate file name detected: Main.java"));
    }

    @Test
    public void testValidateProblemAndLanguageNotFound() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        when(mockContest.getProblems()).thenReturn(new IProblem[]{});
        when(mockContest.getLanguages()).thenReturn(new ILanguage[]{});

        SubmitRunRequest req = new SubmitRunRequest();
        req.setProblemName("Problem C");
        req.setLanguageName("C++");

        SubmissionFileRequest mainFile = new SubmissionFileRequest();
        mainFile.setFileName("Main.cpp");
        mainFile.setFileContentBase64("cHJpbnQoImhlbGxvIikK");
        req.setMainFile(mainFile);

        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertTrue(res.getErrors().contains("Problem 'Problem C' not found."));
        assertTrue(res.getErrors().contains("Language 'C++' not found."));
    }

    @Test
    public void testValidateSuccess() {
        IContest mockContest = mock(IContest.class);
        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        IProblem problem = mock(IProblem.class);
        when(problem.getName()).thenReturn("Problem A");
        when(mockContest.getProblems()).thenReturn(new IProblem[]{problem});

        ILanguage language = mock(ILanguage.class);
        when(language.getName()).thenReturn("Java");
        when(mockContest.getLanguages()).thenReturn(new ILanguage[]{language});

        SubmitRunRequest req = new SubmitRunRequest();
        req.setProblemName("Problem A");
        req.setLanguageName("Java");

        SubmissionFileRequest mainFile = new SubmissionFileRequest();
        mainFile.setFileName("Main.java");
        mainFile.setFileContentBase64("cHJpbnQoImhlbGxvIikK");
        req.setMainFile(mainFile);

        SubmitRunValidationResult res = SubmitRunValidator.validate(mockContest, req);
        assertFalse(res.hasErrors());
        assertEquals(problem, res.getProblem());
        assertEquals(language, res.getLanguage());
    }
}
