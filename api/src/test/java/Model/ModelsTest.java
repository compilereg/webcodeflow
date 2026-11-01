package Model;

import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

public class ModelsTest {

    @Test
    public void testLanguageList() {
        languageList l1 = new languageList();
        assertNull(l1.languageName);
        assertNull(l1.title);

        languageList l2 = new languageList("java", "Java 17");
        assertEquals("java", l2.languageName);
        assertEquals("Java 17", l2.title);
    }

    @Test
    public void testListclarification() {
        listclarification c1 = new listclarification();
        assertNull(c1.teamname);
        assertEquals(0, c1.ClarificationId);
        assertEquals(0, c1.ClarificationTime);
        assertNull(c1.Status);
        assertNull(c1.ProblemName);
        assertNull(c1.Question);
        assertNull(c1.Answer);

        listclarification c2 = new listclarification(
            "team01", 15, 3600, "answered", "A", "Question?", "Answer"
        );
        assertEquals("team01", c2.teamname);
        assertEquals(15, c2.ClarificationId);
        assertEquals(3600, c2.ClarificationTime);
        assertEquals("answered", c2.Status);
        assertEquals("A", c2.ProblemName);
        assertEquals("Question?", c2.Question);
        assertEquals("Answer", c2.Answer);
    }

    @Test
    public void testListProblems() {
        listProblems p1 = new listProblems();
        assertNull(p1.name);
        assertNull(p1.alphabte);
        assertFalse(p1.isDeleted);

        listProblems p2 = new listProblems("Two Sum", "A", true);
        assertEquals("Two Sum", p2.name);
        assertEquals("A", p2.alphabte);
        assertTrue(p2.isDeleted);
    }

    @Test
    public void testListsubmitrun() {
        listsubmitrun r1 = new listsubmitrun();
        assertEquals(0, r1.getSiteNumber());
        assertEquals(0, r1.getRunNumber());
        assertNull(r1.getProblem());
        assertNull(r1.getLanguage());
        assertNull(r1.getJudgement());
        assertFalse(r1.isFinalJudged());
        assertFalse(r1.isPreliminaryJudged());
        assertFalse(r1.isSolved());
        assertFalse(r1.isDeleted());
        assertEquals(0, r1.getSubmissionTime());

        listsubmitrun r2 = new listsubmitrun(
            1, 3, "problem1", "Python", "NEW", false, false, false, false, 125
        );
        assertEquals(1, r2.getSiteNumber());
        assertEquals(3, r2.getRunNumber());
        assertEquals("problem1", r2.getProblem());
        assertEquals("Python", r2.getLanguage());
        assertEquals("NEW", r2.getJudgement());
        assertFalse(r2.isFinalJudged());
        assertFalse(r2.isPreliminaryJudged());
        assertFalse(r2.isSolved());
        assertFalse(r2.isDeleted());
        assertEquals(125, r2.getSubmissionTime());

        // Test setters and getters
        r1.setSiteNumber(2);
        r1.setRunNumber(4);
        r1.setProblem("prob2");
        r1.setLanguage("Java");
        r1.setJudgement("Yes");
        r1.setFinalJudged(true);
        r1.setPreliminaryJudged(true);
        r1.setSolved(true);
        r1.setDeleted(true);
        r1.setSubmissionTime(200);

        assertEquals(2, r1.getSiteNumber());
        assertEquals(4, r1.getRunNumber());
        assertEquals("prob2", r1.getProblem());
        assertEquals("Java", r1.getLanguage());
        assertEquals("Yes", r1.getJudgement());
        assertTrue(r1.isFinalJudged());
        assertTrue(r1.isPreliminaryJudged());
        assertTrue(r1.isSolved());
        assertTrue(r1.isDeleted());
        assertEquals(200, r1.getSubmissionTime());
    }

    @Test
    public void testLoginPage() {
        LoginPage lp1 = new LoginPage();
        assertNull(lp1.username);
        assertNull(lp1.password);

        LoginPage lp2 = new LoginPage("admin", "123456");
        assertEquals("admin", lp2.username);
        assertEquals("123456", lp2.password);
    }

    @Test
    public void testLoginResponse() {
        LoginResponse lr1 = new LoginResponse();
        assertNull(lr1.username);
        assertNull(lr1.token);
        assertNull(lr1.displayName);
        assertNull(lr1.csrfToken);

        LoginResponse lr2 = new LoginResponse("team1", "token123");
        assertEquals("team1", lr2.username);
        assertEquals("token123", lr2.token);
        assertNull(lr2.displayName);
        assertNull(lr2.csrfToken);

        LoginResponse lr3 = new LoginResponse("team1", "token123", "Team 1", "csrf123");
        assertEquals("team1", lr3.username);
        assertEquals("token123", lr3.token);
        assertEquals("Team 1", lr3.displayName);
        assertEquals("csrf123", lr3.csrfToken);
    }

    @Test
    public void testLogoutResponse() {
        LogoutResponse lr1 = new LogoutResponse();
        assertNull(lr1.getStatus());
        assertNull(lr1.getMessage());
        assertNull(lr1.getUsername());
        assertNull(lr1.getDisplayName());

        LogoutResponse lr2 = new LogoutResponse("Success", "Logged out", "team001", "Team 001");
        assertEquals("Success", lr2.getStatus());
        assertEquals("Logged out", lr2.getMessage());
        assertEquals("team001", lr2.getUsername());
        assertEquals("Team 001", lr2.getDisplayName());
    }

    @Test
    public void testSessionResponse() {
        SessionResponse sr1 = new SessionResponse();
        assertFalse(sr1.isAuthenticated());
        assertNull(sr1.getMessage());

        SessionResponse sr2 = new SessionResponse(true, "Session is valid.");
        assertTrue(sr2.isAuthenticated());
        assertEquals("Session is valid.", sr2.getMessage());
    }

    @Test
    public void testSubmissionFileRequest() {
        SubmissionFileRequest sfr = new SubmissionFileRequest();
        assertNull(sfr.getFileName());
        assertNull(sfr.getFileContentBase64());

        sfr.setFileName("main.py");
        sfr.setFileContentBase64("base64data");
        assertEquals("main.py", sfr.getFileName());
        assertEquals("base64data", sfr.getFileContentBase64());
    }

    @Test
    public void testSubmitClarificationRequest() {
        SubmitClarificationRequest scr1 = new SubmitClarificationRequest();
        assertNull(scr1.ProblemName);
        assertNull(scr1.Question);

        SubmitClarificationRequest scr2 = new SubmitClarificationRequest("A", "Question text");
        assertEquals("A", scr2.ProblemName);
        assertEquals("Question text", scr2.Question);
    }

    @Test
    public void testSubmitClarificationResponse() {
        SubmitClarificationResponse scr1 = new SubmitClarificationResponse();
        assertNull(scr1.getStatus());
        assertNull(scr1.getMessage());

        SubmitClarificationResponse scr2 = new SubmitClarificationResponse("Success", "Clarification submitted");
        assertEquals("Success", scr2.getStatus());
        assertEquals("Clarification submitted", scr2.getMessage());
    }

    @Test
    public void testSubmitRunRequest() {
        SubmitRunRequest srr = new SubmitRunRequest();
        assertNull(srr.getProblemName());
        assertNull(srr.getLanguageName());
        assertNull(srr.getMainFile());
        assertNull(srr.getAdditionalFiles());

        SubmissionFileRequest main = new SubmissionFileRequest();
        List<SubmissionFileRequest> additionals = new ArrayList<>();

        srr.setProblemName("A");
        srr.setLanguageName("Java");
        srr.setMainFile(main);
        srr.setAdditionalFiles(additionals);

        assertEquals("A", srr.getProblemName());
        assertEquals("Java", srr.getLanguageName());
        assertSame(main, srr.getMainFile());
        assertSame(additionals, srr.getAdditionalFiles());
    }

    @Test
    public void testSubmitRunResponse() {
        SubmitRunResponse srr1 = new SubmitRunResponse();
        assertNull(srr1.getStatus());
        assertNull(srr1.getMessage());

        SubmitRunResponse srr2 = new SubmitRunResponse("Success", "Run submitted");
        assertEquals("Success", srr2.getStatus());
        assertEquals("Run submitted", srr2.getMessage());
    }
}
