package services;

import edu.csus.ecs.pc2.api.IClarification;
import edu.csus.ecs.pc2.api.IProblem;
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

public class ClarificationUpdatesTest {

    private Contest teamContest;
    private ClarificationUpdates listener;
    private Session mockSession;
    private RemoteEndpoint mockRemote;
    private Map<Session, String> socketConnections;

    @BeforeEach
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        teamContest = mock(Contest.class);
        listener = new ClarificationUpdates(
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
    public void testClarificationAnsweredSuccess() {
        IClarification clar = mock(IClarification.class);
        IProblem problem = mock(IProblem.class);
        ITeam team = mock(ITeam.class);
        Session otherSession = mock(Session.class);
        RemoteEndpoint otherRemote = mock(RemoteEndpoint.class);

        when(problem.getName()).thenReturn("Problem A");
        when(clar.getProblem()).thenReturn(problem);
        when(clar.getQuestion()).thenReturn("How do I do this?");
        when(clar.getAnswer()).thenReturn("Follow the spec.");
        when(clar.getNumber()).thenReturn(1);
        when(team.getLoginName()).thenReturn("team_test");
        when(clar.getTeam()).thenReturn(team);
        when(otherSession.isOpen()).thenReturn(true);
        when(otherSession.getRemote()).thenReturn(otherRemote);
        socketConnections.put(otherSession, "other-team-jwt");

        listener.clarificationAnswered(clar);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"CLARIFICATION_ANSWERED\""));
        assertTrue(json.contains("\"problem\":\"Problem A\""));
        assertTrue(json.contains("\"question\":\"How do I do this?\""));
        assertTrue(json.contains("\"answered\":true"));
        assertTrue(json.contains("\"broadcast\":false"));
        assertTrue(json.contains("\"answer\":\"Follow the spec.\""));
        verifyNoInteractions(otherRemote);
    }

    @Test
    public void testClarificationAnsweredNullProblemFallback() {
        IClarification clar = mock(IClarification.class);
        ITeam team = mock(ITeam.class);

        when(clar.getProblem()).thenReturn(null);
        when(clar.getQuestion()).thenReturn("General question");
        when(clar.getAnswer()).thenReturn("General answer");
        when(clar.getNumber()).thenReturn(2);
        when(team.getLoginName()).thenReturn("team_test");
        when(clar.getTeam()).thenReturn(team);

        listener.clarificationAnswered(clar);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"problem\":\"General\""));
        assertTrue(json.contains("\"question\":\"General question\""));
    }

    @Test
    public void testClarificationUpdatedWithEscapedJsonCharacters() {
        IClarification clar = mock(IClarification.class);
        IProblem problem = mock(IProblem.class);
        ITeam team = mock(ITeam.class);

        when(problem.getName()).thenReturn("Problem B");
        when(clar.getProblem()).thenReturn(problem);
        when(clar.getQuestion()).thenReturn("Question with \"quotes\" and\nnewlines");
        when(clar.getAnswer()).thenReturn("Answer with \\backslashes\\");
        when(clar.getNumber()).thenReturn(3);
        when(team.getLoginName()).thenReturn("team_test");
        when(clar.getTeam()).thenReturn(team);

        listener.clarificationUpdated(clar);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"CLARIFICATION_UPDATED\""));
        assertTrue(json.contains("Question with \\\"quotes\\\" and\\nnewlines"));
        assertTrue(json.contains("Answer with \\\\backslashes\\\\"));
    }

    @Test
    public void testClarificationAddedIgnored() {
        IClarification clar = mock(IClarification.class);
        listener.clarificationAdded(clar);

        // Verification: clarificationAdded should print warning but not broadcast/send WS messages
        verifyNoInteractions(mockRemote);
    }

    @Test
    public void testSendToAllAnswerIncludesBroadcastMetadata() {
        IClarification clar = mock(IClarification.class);
        ITeam otherTeam = mock(ITeam.class);
        when(otherTeam.getLoginName()).thenReturn("another_team");
        when(clar.getTeam()).thenReturn(otherTeam);
        when(clar.getNumber()).thenReturn(12);
        when(clar.getSubmissionTime()).thenReturn(500L);
        when(clar.getQuestion()).thenReturn("Broadcast question");
        when(clar.getAnswer()).thenReturn("Private answer");
        when(clar.isSendToAll()).thenReturn(true);

        listener.clarificationAnswered(clar);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote).sendStringByFuture(jsonCaptor.capture());
        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"clarificationId\":12"));
        assertTrue(json.contains("\"clarificationTime\":500"));
        assertTrue(json.contains("\"teamname\":\"another_team\""));
        assertTrue(json.contains("\"broadcast\":true"));
    }

    @Test
    public void testClarificationRemovedIgnored() {
        IClarification clar = mock(IClarification.class);
        listener.clarificationRemoved(clar);

        verifyNoInteractions(mockRemote);
    }
}
