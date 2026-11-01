package services;

import edu.csus.ecs.pc2.api.IContestClock;
import edu.csus.ecs.pc2.api.implementation.Contest;
import edu.csus.ecs.pc2.api.listener.ContestEvent;
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

public class ConfigurationUpdatesTest {

    private Contest mockContest;
    private IContestClock mockClock;
    private Session mockSession;
    private RemoteEndpoint mockRemote;
    private Map<Session, String> socketConnections;

    @BeforeEach
    @SuppressWarnings("unchecked")
    public void setUp() throws Exception {
        // Reset static teamContest field to null first
        Field teamContestField = ConfigurationUpdates.class.getDeclaredField("teamContest");
        teamContestField.setAccessible(true);
        teamContestField.set(null, null);

        mockContest = mock(Contest.class);
        mockClock = mock(IContestClock.class);
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
    public void testPushRealPc2TriggerNullContestSucceedsWithoutException() {
        // Since teamContest is currently null, this should run and return early without NullPointerException
        assertDoesNotThrow(() -> ConfigurationUpdates.pushRealPc2Trigger("INITIAL_SYNC"));
        verifyNoInteractions(mockRemote);
    }

    @Test
    public void testPushRealPc2TriggerClockUpdateBroadcast() {
        // Instantiate listener to set the static teamContest field
        new ConfigurationUpdates(mockContest, "dummy-jwt");

        when(mockContest.isContestClockRunning()).thenReturn(true);
        when(mockContest.getContestClock()).thenReturn(mockClock);
        when(mockClock.getRemainingSecs()).thenReturn(3600L);
        when(mockClock.getElapsedSecs()).thenReturn(14400L);
        when(mockClock.getContestLengthSecs()).thenReturn(18000L);

        ConfigurationUpdates.pushRealPc2Trigger("TEST_SYNC");

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(mockRemote).sendStringByFuture(jsonCaptor.capture());

        String json = jsonCaptor.getValue();
        assertTrue(json.contains("\"type\":\"CLOCK_UPDATE\""));
        assertTrue(json.contains("\"source\":\"TEST_SYNC\""));
        assertTrue(json.contains("\"running\":true"));
        assertTrue(json.contains("\"remainingSeconds\":3600"));
        assertTrue(json.contains("\"elapsedSeconds\":14400"));
        assertTrue(json.contains("\"contestLengthSeconds\":18000"));
    }

    @Test
    public void testConfigurationEventItemListeners() {
        new ConfigurationUpdates(mockContest, "dummy-jwt");

        when(mockContest.isContestClockRunning()).thenReturn(false);
        when(mockContest.getContestClock()).thenReturn(mockClock);
        when(mockClock.getRemainingSecs()).thenReturn(0L);
        when(mockClock.getElapsedSecs()).thenReturn(18000L);
        when(mockClock.getContestLengthSecs()).thenReturn(18000L);

        ConfigurationUpdates updates = new ConfigurationUpdates(mockContest, "dummy-jwt");
        ContestEvent mockEvent = mock(ContestEvent.class);

        updates.configurationItemAdded(mockEvent);
        verify(mockRemote, times(1)).sendStringByFuture(argThat(msg -> msg.contains("configurationItemAdded")));
        clearInvocations(mockRemote);

        updates.configurationItemRemoved(mockEvent);
        verify(mockRemote, times(1)).sendStringByFuture(argThat(msg -> msg.contains("configurationItemRemoved")));
        clearInvocations(mockRemote);

        updates.configurationItemUpdated(mockEvent);
        verify(mockRemote, times(1)).sendStringByFuture(argThat(msg -> msg.contains("configurationItemUpdated")));
    }
}
