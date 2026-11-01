package controllers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import edu.csus.ecs.pc2.api.IClient;
import edu.csus.ecs.pc2.api.IClient.ClientType;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.ServerConnection;
import edu.csus.ecs.pc2.api.implementation.Contest;
import Model.LoginPage;
import Model.LoginResponse;
import Model.LogoutResponse;
import Model.SessionResponse;
import Model.languageList;
import Model.listProblems;
import helpers.CookiesHandlers;
import helpers.CSRF_Token_Handler;
import exceptions.ApiException;
import exceptions.NoCookieException;
import exceptions.UnauthorizedSessionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.mockito.MockedConstruction;

public class MainControllerTest {

    private maincontroller controller;
    private HttpServletRequest mockRequest;

    @BeforeEach
    public void setUp() throws Exception {
        controller = new maincontroller();
        mockRequest = mock(HttpServletRequest.class);

        // Clear sessions and lockout map to isolate tests
        maincontroller.sessions.clear();
        
        // Reset loginAttempts and lockoutTime fields
        Field loginAttemptsField = GlobalClass.class.getDeclaredField("loginAttempts");
        loginAttemptsField.setAccessible(true);
        Map<String, Integer> attempts = (Map<String, Integer>) loginAttemptsField.get(null);
        attempts.clear();

        Field lockoutTimeField = GlobalClass.class.getDeclaredField("lockoutTime");
        lockoutTimeField.setAccessible(true);
        Map<String, Long> lockouts = (Map<String, Long>) lockoutTimeField.get(null);
        lockouts.clear();

        // Clear CSRF handler tokens map via reflection
        Field csrfField = CSRF_Token_Handler.class.getDeclaredField("csrfTokens");
        csrfField.setAccessible(true);
        Map<String, String> csrfMap = (Map<String, String>) csrfField.get(null);
        csrfMap.clear();
    }

    @Test
    public void testLoginApiNullRequest() {
        Response response = controller.loginApi(null);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        assertTrue(response.getEntity().toString().contains("Missing credentials"));
    }

    @Test
    public void testLoginApiMissingCredentials() {
        LoginPage req = new LoginPage();
        Response response = controller.loginApi(req);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
        assertTrue(response.getEntity().toString().contains("Missing credentials"));
    }

    @Test
    public void testLoginApiLockoutAndMapCleanup() throws Exception {
        LoginPage req = new LoginPage();
        req.username = "bruteforcer";
        req.password = "badpass";

        // Fail 5 times
        for (int i = 0; i < 5; i++) {
            Response response = controller.loginApi(req);
            assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.getStatus());
        }

        // 6th attempt should trigger lockout (Too Many Requests - 429)
        Response response = controller.loginApi(req);
        assertEquals(Response.Status.TOO_MANY_REQUESTS.getStatusCode(), response.getStatus());
        assertTrue(response.getEntity().toString().contains("Too many failed attempts"));

        // Simulate time passing (fast-forward lockout time map)
        Field lockoutTimeField = GlobalClass.class.getDeclaredField("lockoutTime");
        lockoutTimeField.setAccessible(true);
        Map<String, Long> lockouts = (Map<String, Long>) lockoutTimeField.get(null);
        
        // Put the lockout time in the past to simulate expiration
        lockouts.put("bruteforcer", System.currentTimeMillis() - 1000);

        // Try again, should be unlocked, clean the map, and fail normally as 401 instead of 429
        Response unlockedResponse = controller.loginApi(req);
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), unlockedResponse.getStatus());
        
        // Verify maps were cleaned up
        assertFalse(lockouts.containsKey("bruteforcer"), "Lockout map should be cleaned");
        
        Field loginAttemptsField = GlobalClass.class.getDeclaredField("loginAttempts");
        loginAttemptsField.setAccessible(true);
        Map<String, Integer> attempts = (Map<String, Integer>) loginAttemptsField.get(null);
        
        // Wait, the recent failed attempt (unlockedResponse) will put it back to 1. 
        // So the attempts should be 1, not 6.
        assertEquals(1, attempts.get("bruteforcer"), "Attempts should be reset after lockout expiration");
    }

    @Test
    public void testLoginApiXSSSanitization() throws Exception {
        LoginPage req = new LoginPage();
        // Malicious XSS payload in username
        req.username = "<script>alert('xss')</script>";
        req.password = "anypass";

        // The sanitize method should convert it to: &lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;
        // The mock will throw an exception (since it's a raw unmocked connection failing), but we just want to ensure it recorded the sanitized version in the login attempts map
        controller.loginApi(req);

        Field loginAttemptsField = GlobalClass.class.getDeclaredField("loginAttempts");
        loginAttemptsField.setAccessible(true);
        Map<String, Integer> attempts = (Map<String, Integer>) loginAttemptsField.get(null);

        String sanitizedName = "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;";
        assertTrue(attempts.containsKey(sanitizedName), "The username should have been sanitized before hitting the backend logic and being recorded in failure map");
        assertFalse(attempts.containsKey(req.username), "The raw XSS username should not be stored or evaluated");
    }


    @Test
    public void testLoginApiSuccess() {
        LoginPage req = new LoginPage();
        req.username = "team1";
        req.password = "pass1";

        try (MockedConstruction<ServerConnection> mocked = mockConstruction(ServerConnection.class, (mock, context) -> {
            IClient mockClient = mock(IClient.class);
            when(mockClient.getType()).thenReturn(ClientType.TEAM_CLIENT);
            when(mockClient.getDisplayName()).thenReturn("Test Team 1");
            when(mock.getMyClient()).thenReturn(mockClient);
            // Contest and services
            Contest mockContest = mock(Contest.class);
            when(mock.getContest()).thenReturn(mockContest);
        })) {
            Response response = controller.loginApi(req);
            assertEquals(Response.Status.OK.getStatusCode(), response.getStatus(), "Valid team login should return 200 OK");
            
            LoginResponse res = (LoginResponse) response.getEntity();
            assertEquals("team1", res.username);
            assertEquals("Test Team 1", res.displayName);
            assertNotNull(res.token);
            assertNotNull(res.csrfToken);
            
            assertTrue(maincontroller.sessions.containsKey(res.token), "Session should be stored in the map");
        }
    }

    @Test
    public void testLoginApiNonTeamClient() {
        LoginPage req = new LoginPage();
        req.username = "judge1";
        req.password = "pass1";

        try (MockedConstruction<ServerConnection> mocked = mockConstruction(ServerConnection.class, (mock, context) -> {
            IClient mockClient = mock(IClient.class);
            when(mockClient.getType()).thenReturn(null); // Not a team
            when(mock.getMyClient()).thenReturn(mockClient);
        })) {
            Response response = controller.loginApi(req);
            assertEquals(Response.Status.FORBIDDEN.getStatusCode(), response.getStatus(), "Non-team client should be forbidden");
            assertTrue(response.getEntity().toString().contains("Only team accounts allowed"));
        }
    }

    @Test
    public void testLoginApiConnectionException() {
        LoginPage req = new LoginPage();
        req.username = "errorUser";
        req.password = "errorPass";

        try (MockedConstruction<ServerConnection> mocked = mockConstruction(ServerConnection.class, (mock, context) -> {
            // Throw exception during login to simulate PC2 server being down or invalid credentials
            doThrow(new RuntimeException("Connection Refused")).when(mock).login(anyString(), anyString());
        })) {
            Response response = controller.loginApi(req);
            assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.getStatus(), "Exception during login should map to 401");
            assertTrue(response.getEntity().toString().contains("Login failed"));
        }
    }

    @Test
    public void testListLanguagesUnauthorizedNoCookie() {
        when(mockRequest.getCookies()).thenReturn(null);
        
        NoCookieException e = assertThrows(NoCookieException.class, () -> {
            controller.listlanguages(mockRequest);
        });
        assertEquals(Response.Status.UNAUTHORIZED, e.getStatus());
    }

    @Test
    public void testListLanguagesUnauthorizedInvalidToken() {
        // Generate a cryptographically valid token (so verifyCookie passes)
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        
        // Do NOT add to sessions, but register CSRF token to bypass CSRF check if it ran
        CSRF_Token_Handler.generate(validToken);
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfTokenFor(validToken));

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});

        UnauthorizedSessionException e = assertThrows(UnauthorizedSessionException.class, () -> {
            controller.listlanguages(mockRequest);
        });
        assertEquals(Response.Status.UNAUTHORIZED, e.getStatus());
    }

    @Test
    public void testListLanguagesForbiddenInvalidCSRF() {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);
        CSRF_Token_Handler.generate(validToken);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn("wrong-csrf-token");

        WebApplicationException e = assertThrows(WebApplicationException.class, () -> {
            controller.listlanguages(mockRequest);
        });
        assertEquals(Response.Status.FORBIDDEN.getStatusCode(), e.getResponse().getStatus());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testListLanguagesSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        maincontroller.sessions.put(validToken, mock(ServerConnection.class));
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        ILanguage lang1 = mock(ILanguage.class);
        when(lang1.getName()).thenReturn("Java");
        when(lang1.getCompilerCommandLine()).thenReturn("javac");

        ILanguage lang2 = mock(ILanguage.class);
        when(lang2.getName()).thenReturn("Python");
        when(lang2.getCompilerCommandLine()).thenReturn("python");

        when(mockContest.getLanguages()).thenReturn(new ILanguage[]{lang1, lang2});

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        Response response = controller.listlanguages(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        List<languageList> result = (List<languageList>) response.getEntity();
        assertEquals(2, result.size());
        assertEquals("Java", result.get(0).languageName);
        assertEquals("javac", result.get(0).title);
        assertEquals("Python", result.get(1).languageName);
        assertEquals("python", result.get(1).title);
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testListProblemSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        maincontroller.sessions.put(validToken, mock(ServerConnection.class));
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Contest mockContest = mock(Contest.class);
        when(mockConn.getContest()).thenReturn(mockContest);

        IProblem prob1 = mock(IProblem.class);
        when(prob1.getName()).thenReturn("Problem A");
        when(prob1.getShortName()).thenReturn("A");
        when(prob1.isDeleted()).thenReturn(false);

        IProblem prob2 = mock(IProblem.class);
        when(prob2.getName()).thenReturn("Problem B");
        when(prob2.getShortName()).thenReturn("B");
        when(prob2.isDeleted()).thenReturn(true);

        when(mockContest.getProblems()).thenReturn(new IProblem[]{prob1, prob2});

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        Response response = controller.listProblem(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());

        List<listProblems> result = (List<listProblems>) response.getEntity();
        assertEquals(2, result.size());
        assertEquals("Problem A", result.get(0).name);
        assertEquals("A", result.get(0).alphabte);
        assertFalse(result.get(0).isDeleted);
        assertEquals("Problem B", result.get(1).name);
        assertEquals("B", result.get(1).alphabte);
        assertTrue(result.get(1).isDeleted);
    }

    @Test
    public void testLogoutSuccess() throws Exception {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        IClient mockClient = mock(IClient.class);
        when(mockClient.getLoginName()).thenReturn("testuser");
        when(mockClient.getDisplayName()).thenReturn("Test User");
        when(mockConn.getMyClient()).thenReturn(mockClient);

        maincontroller.sessions.put(validToken, mockConn);
        String csrfToken = CSRF_Token_Handler.generate(validToken);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});
        when(mockRequest.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        Response response = controller.logout(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        assertFalse(maincontroller.sessions.containsKey(validToken));
        assertNull(csrfTokenFor(validToken));
    }

    @Test
    public void testValidateTokenValid() {
        String validToken = CookiesHandlers.genCookieID("team", "testuser", "testuser");
        ServerConnection mockConn = mock(ServerConnection.class);
        when(mockConn.isLoggedIn()).thenReturn(true);
        maincontroller.sessions.put(validToken, mockConn);

        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, validToken);
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});

        Response response = controller.validateToken(mockRequest);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
        SessionResponse res = (SessionResponse) response.getEntity();
        assertTrue(res.isAuthenticated());
    }

    @Test
    public void testValidateTokenInvalid() {
        Cookie cookie = new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, "invalid-token-here");
        when(mockRequest.getCookies()).thenReturn(new Cookie[]{cookie});

        Response response = controller.validateToken(mockRequest);
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.getStatus());
        SessionResponse res = (SessionResponse) response.getEntity();
        assertFalse(res.isAuthenticated());
    }

    @SuppressWarnings("unchecked")
    private String csrfTokenFor(String sessionToken) {
        try {
            Field csrfField = CSRF_Token_Handler.class.getDeclaredField("csrfTokens");
            csrfField.setAccessible(true);
            Map<String, String> csrfMap = (Map<String, String>) csrfField.get(null);
            return csrfMap.get(sessionToken);
        } catch (Exception e) {
            return null;
        }
    }
}
