package services;

import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.IRun;
import edu.csus.ecs.pc2.api.ITeam;
import edu.csus.ecs.pc2.api.implementation.Contest;
import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import websocket.ContestSocket;

import java.lang.reflect.Field;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class SubmissionUpdatesTest {

    private Contest teamContest;
    private SubmissionUpdates listener;
    private Session mockSession;
    private RemoteEndpoint mockRemote;
    private Map<Session, String> socketConnections;

    @BeforeEach
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        teamContest = mock(Contest.class);
        listener = new SubmissionUpdates(
            teamContest,
            "dummy-jwt",
            "team_test"
        );

        mockSession = mock(Session.class);
        mockRemote = mock(RemoteEndpoint.class);
        when(mockSession.isOpen()).thenReturn(true);
        when(mockSession.getRemote()).thenReturn(mockRemote);
        when(mockRemote.sendStringByFuture(anyString())).thenReturn(CompletableFuture.completedFuture(null));
        // Access the private static connections map in ContestSocket
        Field connectionsField = ContestSocket.class.getDeclaredField("connections");
        connectionsField.setAccessible(true);
        socketConnections = (Map<Session, String>) connectionsField.get(null);
        socketConnections.clear();
        socketConnections.put(mockSession, "dummy-jwt");
    }

    @Test
    public void testRunSubmittedIsIgnored() {
        IRun run = mock(IRun.class);
        listener.runSubmitted(run);

        verifyNoInteractions(mockRemote);
    }

    @Test
    public void testRunJudgedBroadcastsCorrectJSON() {
        IRun run = mock(IRun.class);
        IProblem problem = mock(IProblem.class);
        ILanguage language = mock(ILanguage.class);
        own(run);

        when(problem.getName()).thenReturn("Problem X");
        when(language.getName()).thenReturn("Java");
        when(run.getProblem()).thenReturn(problem);
        when(run.getLanguage()).thenReturn(language);
        when(run.getJudgementName()).thenReturn("Accepted");
        when(run.getSiteNumber()).thenReturn(1);
        when(run.getNumber()).thenReturn(12);
        when(run.isFinalJudged()).thenReturn(true);
        when(run.isPreliminaryJudged()).thenReturn(false);
        when(run.isSolved()).thenReturn(true);
        when(run.isDeleted()).thenReturn(false);

        listener.runJudged(run, true);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote, times(1)).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"RUN_JUDGED\""));
        assertTrue(json.contains("\"siteNumber\":1"));
        assertTrue(json.contains("\"runNumber\":12"));
        assertTrue(json.contains("\"problem\":\"Problem X\""));
        assertTrue(json.contains("\"language\":\"Java\""));
        assertTrue(json.contains("\"judgement\":\"Accepted\""));
        assertTrue(json.contains("\"finalEvent\":true"));
        assertTrue(json.contains("\"finalJudged\":true"));
        assertTrue(json.contains("\"solved\":true"));
        assertTrue(json.contains("\"deleted\":false"));
    }

    @Test
    public void testRunUpdatedIgnoredIfNotJudged() {
        IRun run = mock(IRun.class);
        own(run);
        when(run.isFinalJudged()).thenReturn(false);
        when(run.isPreliminaryJudged()).thenReturn(false);

        listener.runUpdated(run, true);

        verifyNoInteractions(mockRemote);
    }

    @Test
    public void testRunUpdatedBroadcastsIfJudged() {
        IRun run = mock(IRun.class);
        own(run);
        when(run.isFinalJudged()).thenReturn(true);
        when(run.isPreliminaryJudged()).thenReturn(false);
        when(run.getSiteNumber()).thenReturn(2);
        when(run.getNumber()).thenReturn(45);

        listener.runUpdated(run, false);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote, times(1)).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"RUN_UPDATED\""));
        assertTrue(json.contains("\"runNumber\":45"));
        assertTrue(json.contains("\"finalEvent\":false"));
    }

    @Test
    public void testRunDeletedBroadcastsWhenJudgementWasCleared() {
        IRun run = mock(IRun.class);
        own(run);

        /*
         * PC2 may clear judgement information while deleting the run.
         * The deletion must still be broadcast so the frontend and
         * global scoreboard remain synchronized.
         */
        when(run.isFinalJudged()).thenReturn(false);
        when(run.isPreliminaryJudged()).thenReturn(false);
        when(run.isDeleted()).thenReturn(true);
        when(run.getSiteNumber()).thenReturn(1);
        when(run.getNumber()).thenReturn(77);

        listener.runDeleted(run);

        ArgumentCaptor<String> jsonCaptor =
            ArgumentCaptor.forClass(String.class);

        verify(mockRemote, times(1))
            .sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();

        assertTrue(json.contains("\"type\":\"RUN_DELETED\""));
        assertTrue(json.contains("\"siteNumber\":1"));
        assertTrue(json.contains("\"runNumber\":77"));
        assertTrue(json.contains("\"deleted\":true"));
    }
    @Test
    public void testRunDeletedBroadcastsIfJudged() {
        IRun run = mock(IRun.class);
        own(run);
        when(run.isFinalJudged()).thenReturn(false);
        when(run.isPreliminaryJudged()).thenReturn(true);
        when(run.getSiteNumber()).thenReturn(1);
        when(run.getNumber()).thenReturn(99);

        listener.runDeleted(run);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote, times(1)).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"RUN_DELETED\""));
        assertTrue(json.contains("\"runNumber\":99"));
    }

    @Test
    public void testOtherTeamsJudgementIsNotSent() {
        IRun run = mock(IRun.class);
        ITeam otherTeam = mock(ITeam.class);
        when(otherTeam.getLoginName()).thenReturn("another_team");
        when(run.getTeam()).thenReturn(otherTeam);
        when(run.isFinalJudged()).thenReturn(true);

        listener.runJudged(run, true);

        verifyNoInteractions(mockRemote);
    }

    private void own(IRun run) {
        ITeam team = mock(ITeam.class);
        when(team.getLoginName()).thenReturn("team_test");
        when(run.getTeam()).thenReturn(team);
    }
}
