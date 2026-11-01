package controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.io.File;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import edu.csus.ecs.pc2.api.IClient;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IContestClock;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.IClarification;
import edu.csus.ecs.pc2.api.ITeam;
import edu.csus.ecs.pc2.api.IRun;
import edu.csus.ecs.pc2.api.ServerConnection;
import edu.csus.ecs.pc2.api.implementation.Contest;
import Model.SubmitClarificationRequest;
import Model.SubmitClarificationResponse;
import Model.SubmitRunRequest;
import Model.SubmissionFileRequest;
import Model.SubmitRunResponse;
import Model.listclarification;
import Model.listsubmitrun;
import helpers.CookiesHandlers;
import helpers.CSRF_Token_Handler;
import exceptions.ApiException;
import exceptions.NoCookieException;
import exceptions.UnauthorizedSessionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class TeamControllerTest {

    private teamcontroller controller;
    private HttpServletRequest mockRequest;

    @BeforeEach
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        controller = new teamcontroller();
        mockRequest = mock(HttpServletRequest.class);

        // Clear sessions and CSRF map
        maincontroller.sessions.clear();

        Field csrfField = CSRF_Token_Handler.class.getDeclaredField("csrfTokens");
        csrfField.setAccessible(true);
        Map<String, String> csrfMap = (Map<String, String>) csrfField.get(null);
        csrfMap.clear();
    }

    @Test
    public void testListClarificationUnauthorized() {
        when(mockRequest.getCookies()).thenReturn(null);
        
        assertThrows(NoCookieException.class, () -> {
            controller.listClarification(mockRequest);
        });
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testListClarificationSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        IClient mockClient = mock(IClient.class);
        when(mockClient.getLoginName()).thenReturn("testuser");
        when(mockClient.getDisplayName()).thenReturn("Test Team");
        when(mockConn.getMyClient()).thenReturn(mockClient);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IClarification clar = mock(IClarification.class);
        when(clar.isAnswered()).thenReturn(true);
        when(clar.getNumber()).thenReturn(42);
        when(clar.getSubmissionTime()).thenReturn(3600L);
        when(clar.getQuestion()).thenReturn("How to solve A?");
        when(clar.getAnswer()).thenReturn("Use DP.");

        ITeam mockTeam = mock(ITeam.class);
        when(mockTeam.getLoginName()).thenReturn("testuser");
        when(clar.getTeam()).thenReturn(mockTeam);

        IProblem mockProblem = mock(IProblem.class);
        when(mockProblem.getName()).thenReturn("Problem A");
        when(clar.getProblem()).thenReturn(mockProblem);

        IClarification otherTeamClarification = mock(IClarification.class);
        ITeam otherTeam = mock(ITeam.class);
        when(otherTeam.getLoginName()).thenReturn("another_team");
        when(otherTeamClarification.getTeam()).thenReturn(otherTeam);
        when(otherTeamClarification.getNumber()).thenReturn(43);
        when(otherTeamClarification.getQuestion()).thenReturn("Private question");

        IClarification broadcastClarification = mock(IClarification.class);
        when(broadcastClarification.getTeam()).thenReturn(otherTeam);
        when(broadcastClarification.isSendToAll()).thenReturn(true);
        when(broadcastClarification.isAnswered()).thenReturn(true);
        when(broadcastClarification.getNumber()).thenReturn(44);
        when(broadcastClarification.getSubmissionTime()).thenReturn(3700L);
        when(broadcastClarification.getQuestion()).thenReturn("Broadcast question");
        when(broadcastClarification.getAnswer()).thenReturn("Broadcast answer");
        when(broadcastClarification.getProblem()).thenReturn(mockProblem);

        when(mockContest.getClarifications()).thenReturn(
            new IClarification[]{
                clar,
                otherTeamClarification,
                broadcastClarification
            }
        );

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        Response response = controller.listClarification(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        List<listclarification> result = (List<listclarification>) response.getEntity();
        assertEquals(2, result.size());
        assertEquals("testuser", result.get(0).teamname);
        assertEquals(42, result.get(0).ClarificationId);
        assertEquals(3600, result.get(0).ClarificationTime);
        assertEquals("Answered", result.get(0).Status);
        assertEquals("Problem A", result.get(0).ProblemName);
        assertEquals("How to solve A?", result.get(0).Question);
        assertEquals("Use DP.", result.get(0).Answer);
        assertEquals("another_team", result.get(1).teamname);
        assertEquals(44, result.get(1).ClarificationId);
        assertEquals("Broadcast", result.get(1).Status);
        assertEquals("Broadcast answer", result.get(1).Answer);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testListSubmitRunsSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IRun run1 = mock(IRun.class);
        when(run1.getSiteNumber()).thenReturn(1);
        when(run1.getNumber()).thenReturn(5);
        when(run1.isFinalJudged()).thenReturn(true);
        when(run1.isPreliminaryJudged()).thenReturn(false);
        when(run1.getJudgementName()).thenReturn("Accepted");
        when(run1.isSolved()).thenReturn(true);
        when(run1.isDeleted()).thenReturn(false);
        when(run1.getSubmissionTime()).thenReturn(200L);

        IProblem mockProblem = mock(IProblem.class);
        when(mockProblem.getName()).thenReturn("Problem A");
        when(run1.getProblem()).thenReturn(mockProblem);

        ILanguage mockLanguage = mock(ILanguage.class);
        when(mockLanguage.getName()).thenReturn("Java");
        when(run1.getLanguage()).thenReturn(mockLanguage);

        when(mockContest.getRuns()).thenReturn(new IRun[]{run1});

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        Response response = controller.listSubmitRuns(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        List<listsubmitrun> result = (List<listsubmitrun>) response.getEntity();
        assertEquals(1, result.size());
        assertEquals(1, result.get(0).getSiteNumber());
        assertEquals(5, result.get(0).getRunNumber());
        assertEquals("Problem A", result.get(0).getProblem());
        assertEquals("Java", result.get(0).getLanguage());
        assertEquals("Accepted", result.get(0).getJudgement());
        assertTrue(result.get(0).isFinalJudged());
        assertFalse(result.get(0).isPreliminaryJudged());
        assertTrue(result.get(0).isSolved());
    }

    @Test
    public void testSubmitClarificationStoppedContest() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(false); // stopped
        when(mockContest.getContestClock()).thenReturn(mockClock);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        SubmitClarificationRequest payload = new SubmitClarificationRequest("Problem A", "Some question");

        ApiException e = assertThrows(ApiException.class, () -> {
            controller.submitClarification(mockRequest, payload);
        });
        assertEquals(Response.Status.FORBIDDEN, e.getStatus());
        assertTrue(e.getMessage().contains("contest is stopped or paused"));
    }

    @Test
    public void testSubmitClarificationEmptyQuestion() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        SubmitClarificationRequest payload = new SubmitClarificationRequest("Problem A", "");

        ApiException e = assertThrows(ApiException.class, () -> {
            controller.submitClarification(mockRequest, payload);
        });
        assertEquals(Response.Status.BAD_REQUEST, e.getStatus());
        assertTrue(e.getMessage().contains("Question text cannot be empty"));
    }

    @Test
    public void testSubmitClarificationProblemNotFound() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);
        when(mockContest.getProblems()).thenReturn(new IProblem[]{});
        when(mockContest.getClarificationCategories()).thenReturn(new IProblem[]{});

        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        SubmitClarificationRequest payload = new SubmitClarificationRequest("Problem A", "How is DP used?");

        ApiException e = assertThrows(ApiException.class, () -> {
            controller.submitClarification(mockRequest, payload);
        });
        assertEquals(Response.Status.BAD_REQUEST, e.getStatus());
        assertTrue(e.getMessage().contains("not found"));
    }

    @Test
    public void testSubmitClarificationSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        IProblem mockProblem = mock(IProblem.class);
        when(mockProblem.getName()).thenReturn("Problem A");
        when(mockContest.getProblems()).thenReturn(new IProblem[]{mockProblem});

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        SubmitClarificationRequest payload = new SubmitClarificationRequest("Problem A", "How is DP used?");

        Response response = controller.submitClarification(mockRequest, payload);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        SubmitClarificationResponse res = (SubmitClarificationResponse) response.getEntity();
        assertEquals("Success", res.getStatus());
        assertEquals("Clarification submitted", res.getMessage());

        verify(mockConn, times(1)).submitClarification(mockProblem, "How is DP used?");
    }

    @Test
    public void testSubmitRunSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IContestClock mockClock = mock(IContestClock.class);
        when(mockClock.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);

        IProblem mockProblem = mock(IProblem.class);
        when(mockProblem.getName()).thenReturn("Problem A");
        when(mockContest.getProblems()).thenReturn(new IProblem[]{mockProblem});

        ILanguage mockLanguage = mock(ILanguage.class);
        when(mockLanguage.getName()).thenReturn("Java");
        when(mockContest.getLanguages()).thenReturn(new ILanguage[]{mockLanguage});

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        SubmitRunRequest request = new SubmitRunRequest();
        request.setProblemName("Problem A");
        request.setLanguageName("Java");
        
        SubmissionFileRequest mainFile = new SubmissionFileRequest();
        mainFile.setFileName("Main.java");
        mainFile.setFileContentBase64("cHJpbnQoImhlbGxvIikK"); // valid base64
        request.setMainFile(mainFile);

        Response response = controller.submitRun(request, mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        SubmitRunResponse res = (SubmitRunResponse) response.getEntity();
        assertEquals("Success", res.getStatus());
        assertEquals("Run submitted successfully", res.getMessage());

        verify(mockConn, times(1)).submitJudgeRun(
            eq(mockProblem),
            eq(mockLanguage),
            anyString(),
            any(String[].class)
        );
    }
}
