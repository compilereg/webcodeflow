package helpers;

import org.junit.jupiter.api.Test;
import javax.servlet.http.Cookie;
import javax.ws.rs.core.NewCookie;
import exceptions.NoCookieException;
import exceptions.NotVerifiedCookieException;

import static org.junit.jupiter.api.Assertions.*;

public class CookiesHandlersTest {

    @Test
    public void testGenCookieIDAndVerifyCookieSuccess() throws Exception {
        String role = "team";
        String login = "testteam";
        String displayName = "Test Team Display";

        // Generate cookie ID (JWT)
        String token = CookiesHandlers.genCookieID(role, login, displayName);
        assertNotNull(token);
        assertFalse(token.trim().isEmpty());

        // Verify the cookie
        boolean result = CookiesHandlers.verifyCookie(token);
        assertTrue(result);
    }

    @Test
    public void testVerifyCookieInvalid() {
        String invalidToken = "invalid.token.value";
        
        assertThrows(NotVerifiedCookieException.class, () -> {
            CookiesHandlers.verifyCookie(invalidToken);
        });
    }

    @Test
    public void testGetCookieSuccess() throws Exception {
        Cookie[] cookies = new Cookie[] {
            new Cookie("some_other", "value1"),
            new Cookie(CookiesHandlers.AUTH_COOKIE_NAME, "jwt-token-xyz"),
            new Cookie("another", "value2")
        };

        String value = CookiesHandlers.getCookie(cookies, CookiesHandlers.AUTH_COOKIE_NAME);
        assertEquals("jwt-token-xyz", value);
    }

    @Test
    public void testGetCookieNullCookies() {
        assertThrows(NoCookieException.class, () -> {
            CookiesHandlers.getCookie(null, CookiesHandlers.AUTH_COOKIE_NAME);
        });
    }

    @Test
    public void testGetCookieMissingTarget() {
        Cookie[] cookies = new Cookie[] {
            new Cookie("some_other", "value1")
        };

        assertThrows(NoCookieException.class, () -> {
            CookiesHandlers.getCookie(cookies, CookiesHandlers.AUTH_COOKIE_NAME);
        });
    }

    @Test
    public void testCreateCookie() {
        String token = "my-jwt-token";
        NewCookie cookie = CookiesHandlers.createCookie(token);
        
        assertNotNull(cookie);
        assertEquals(CookiesHandlers.AUTH_COOKIE_NAME, cookie.getName());
        assertEquals(token, cookie.getValue());
        assertEquals("/", cookie.getPath());
        assertEquals(21600, cookie.getMaxAge());
        assertTrue(cookie.isHttpOnly());
        assertFalse(cookie.isSecure()); // secure flag is false by default in our implementation
    }

    @Test
    public void testGetCookieHeader() {
        String token = "my-token";
        String header = CookiesHandlers.getCookieHeader(token);
        
        assertNotNull(header);
        assertTrue(header.contains(CookiesHandlers.AUTH_COOKIE_NAME + "=" + token));
        assertTrue(header.contains("Path=/"));
        assertTrue(header.contains("HttpOnly"));
        assertTrue(header.contains("SameSite=Strict"));
    }

    @Test
    public void testClearAuthCookie() {
        NewCookie cookie = CookiesHandlers.clearAuthCookie();
        
        assertNotNull(cookie);
        assertEquals(CookiesHandlers.AUTH_COOKIE_NAME, cookie.getName());
        assertEquals("", cookie.getValue());
        assertEquals("/", cookie.getPath());
        assertEquals(0, cookie.getMaxAge());
        assertTrue(cookie.isHttpOnly());
    }
}
