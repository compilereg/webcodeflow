package helpers;

import javax.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CorsConfigTest {

    private HttpServletRequest request;

    @BeforeEach
    public void setUp() {
        request = mock(HttpServletRequest.class);
    }

    @Test
    public void testAllowAnyOriginIsEnabled() {
        assertTrue(CorsConfig.ALLOW_ANY_ORIGIN);
    }

    @Test
    public void testAnyOriginIsAllowedWhenAllowAny() {
        assertTrue(CorsConfig.isOriginAllowed("http://evil-attacker.com"));
        assertTrue(CorsConfig.isOriginAllowed("http://localhost:3000"));
        assertTrue(CorsConfig.isOriginAllowed(null));
    }

    @Test
    public void testValidateOriginNullSucceeds() {
        when(request.getHeader("Origin")).thenReturn(null);
        assertDoesNotThrow(() -> CorsConfig.validateOrigin(request));
    }

    @Test
    public void testValidateOriginAnySucceedsWhileAllowAny() {
        when(request.getHeader("Origin")).thenReturn("http://evil-attacker.com");
        assertDoesNotThrow(() -> CorsConfig.validateOrigin(request));
    }
}
