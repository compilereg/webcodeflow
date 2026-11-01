package websocket;

import org.eclipse.jetty.websocket.api.RemoteEndpoint;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.UpgradeRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import java.net.HttpCookie;
import java.net.InetSocketAddress;
import java.util.Collections;
import java.util.List;

import controllers.maincontroller;
import helpers.CookiesHandlers;
import services.ConfigurationUpdates;
import edu.csus.ecs.pc2.api.ServerConnection;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

public class ContestSocketTest {

    private ContestSocket contestSocket;
    private Session mockSession;
    private UpgradeRequest mockUpgradeRequest;
    private RemoteEndpoint mockRemoteEndpoint;

    @BeforeEach
    public void setUp() {
        contestSocket = new ContestSocket();
        mockSession = mock(Session.class);
        mockUpgradeRequest = mock(UpgradeRequest.class);
        mockRemoteEndpoint = mock(RemoteEndpoint.class);

        when(mockSession.getUpgradeRequest()).thenReturn(mockUpgradeRequest);
        when(mockSession.getRemote()).thenReturn(mockRemoteEndpoint);
        when(mockSession.getRemoteAddress()).thenReturn(new InetSocketAddress("127.0.0.1", 12345));
        maincontroller.sessions.clear();
    }

    @Test
    public void testOnConnect_Success() throws Exception {
        String token = "valid_jwt_token_for_ws";
        
        // Mock cookies
        HttpCookie mockCookie = new HttpCookie(CookiesHandlers.AUTH_COOKIE_NAME, token);
        when(mockUpgradeRequest.getCookies()).thenReturn(Collections.singletonList(mockCookie));
        
        // Mock origin
        when(mockUpgradeRequest.getHeader("Origin")).thenReturn("http://wwffrontend.aast.edu");

        // Mock static behavior for maincontroller and CookiesHandlers
        ServerConnection mockConnection = mock(ServerConnection.class);
        maincontroller.sessions.put(token, mockConnection);

        try (MockedStatic<CookiesHandlers> mockedCookiesHandlers = mockStatic(CookiesHandlers.class)) {
            mockedCookiesHandlers.when(() -> CookiesHandlers.getCookie(any(), eq(CookiesHandlers.AUTH_COOKIE_NAME)))
                                 .thenReturn(token);
            mockedCookiesHandlers.when(() -> CookiesHandlers.verifyCookie(token))
                                 .thenReturn(true);

            // Act
            contestSocket.onConnect(mockSession);

            // Assert
            verify(mockSession, never()).close(anyInt(), anyString());
            verify(mockSession).setIdleTimeout(60L * 60L * 1000L);
            verify(mockRemoteEndpoint).sendString("{\"type\":\"WS_CONNECTED\",\"message\":\"connected\"}");
        }
    }

    @Test
    public void testOnConnect_MissingToken() {
        // No cookies
        when(mockUpgradeRequest.getCookies()).thenReturn(Collections.emptyList());

        // Act
        contestSocket.onConnect(mockSession);

        // Assert
        verify(mockSession).close(eq(1008), eq("Unauthorized"));
    }

    @Test
    public void testOnConnect_InvalidOrigin() {
        String token = "valid_jwt_token_for_ws";
        
        // Mock cookies
        HttpCookie mockCookie = new HttpCookie(CookiesHandlers.AUTH_COOKIE_NAME, token);
        when(mockUpgradeRequest.getCookies()).thenReturn(Collections.singletonList(mockCookie));
        
        // Invalid origin
        when(mockUpgradeRequest.getHeader("Origin")).thenReturn("http://evil-origin.com");
        ServerConnection mockConnection = mock(ServerConnection.class);
        maincontroller.sessions.put(token, mockConnection);

        try (MockedStatic<CookiesHandlers> mockedCookiesHandlers = mockStatic(CookiesHandlers.class)) {
            mockedCookiesHandlers.when(() -> CookiesHandlers.getCookie(any(), eq(CookiesHandlers.AUTH_COOKIE_NAME)))
                                 .thenReturn(token);
            mockedCookiesHandlers.when(() -> CookiesHandlers.verifyCookie(token))
                                 .thenReturn(true);

            // Act
            contestSocket.onConnect(mockSession);

            // Assert
            verify(mockSession).close(eq(1008), eq("Unauthorized"));
        }
    }

    @Test
    public void testOnMessage_JoinTriggersSync() {
        try (MockedStatic<ConfigurationUpdates> mockedConfigUpdates = mockStatic(ConfigurationUpdates.class)) {
            
            // Act
            contestSocket.onMessage(mockSession, "{\"action\": \"JOIN\"}");

            // Assert
            mockedConfigUpdates.verify(() -> ConfigurationUpdates.pushRealPc2Trigger("INITIAL_SYNC"), times(1));
        }
    }

    @Test
    public void testOnMessage_OtherMessageDoesNotTriggerSync() {
        try (MockedStatic<ConfigurationUpdates> mockedConfigUpdates = mockStatic(ConfigurationUpdates.class)) {
            
            // Act
            contestSocket.onMessage(mockSession, "{\"action\": \"PING\"}");

            // Assert
            mockedConfigUpdates.verify(() -> ConfigurationUpdates.pushRealPc2Trigger("INITIAL_SYNC"), never());
        }
    }

    @Test
    public void testOnClose_RemovesSession() {
        // We first need to add it, but onClose should not throw even if empty.
        // It should also clean the messageAttempts.
        assertDoesNotThrow(() -> contestSocket.onClose(mockSession, 1000, "Normal closure"));
    }

    @Test
    public void testDisconnectToken_ClosesSpecificSession() throws Exception {
        String token = "session_to_disconnect";
        
        // Mock setup to store connection
        HttpCookie mockCookie = new HttpCookie(CookiesHandlers.AUTH_COOKIE_NAME, token);
        when(mockUpgradeRequest.getCookies()).thenReturn(Collections.singletonList(mockCookie));
        when(mockUpgradeRequest.getHeader("Origin")).thenReturn("http://wwffrontend.aast.edu");
        ServerConnection mockConnection = mock(ServerConnection.class);
        maincontroller.sessions.put(token, mockConnection);
        when(mockSession.isOpen()).thenReturn(true);

        try (MockedStatic<CookiesHandlers> mockedCookiesHandlers = mockStatic(CookiesHandlers.class)) {
            mockedCookiesHandlers.when(() -> CookiesHandlers.getCookie(any(), eq(CookiesHandlers.AUTH_COOKIE_NAME)))
                                 .thenReturn(token);
            mockedCookiesHandlers.when(() -> CookiesHandlers.verifyCookie(token))
                                 .thenReturn(true);

            // Connect to store session
            contestSocket.onConnect(mockSession);
        }

        // Act
        ContestSocket.disconnectToken(token);

        // Assert
        verify(mockSession).close(1000, "Logged out");
    }
}
