package helpers;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class CSRF_Token_HandlerTest {

    private HttpServletRequest request;

    @BeforeEach
    public void setUp() {
        request = mock(HttpServletRequest.class);
    }

    @Test
    public void testCSRFTokenGenerationAndSuccessfulValidation() {
        String sessionToken = "session_123";
        String csrfToken = CSRF_Token_Handler.generate(sessionToken);

        assertNotNull(csrfToken);
        assertFalse(csrfToken.isEmpty());

        when(request.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        assertDoesNotThrow(() -> CSRF_Token_Handler.validate(request, sessionToken));
    }

    @Test
    public void testValidateRequestSucceedsWithValidToken() {
        String sessionToken = "session_combo";
        String csrfToken = CSRF_Token_Handler.generate(sessionToken);

        when(request.getHeader("Origin")).thenReturn("http://evil-attacker.com");
        when(request.getHeader("X-CSRF-Token")).thenReturn(csrfToken);

        // ALLOW_ANY_ORIGIN is true, so any origin + valid CSRF passes
        assertDoesNotThrow(() -> CSRF_Token_Handler.validateRequest(request, sessionToken));
    }

    @Test
    public void testCSRFTokenValidationMissingHeader() {
        String sessionToken = "session_456";
        CSRF_Token_Handler.generate(sessionToken);

        when(request.getHeader("X-CSRF-Token")).thenReturn(null);

        WebApplicationException ex = assertThrows(WebApplicationException.class, () -> {
            CSRF_Token_Handler.validate(request, sessionToken);
        });

        assertEquals(Response.Status.FORBIDDEN.getStatusCode(), ex.getResponse().getStatus());
        assertTrue(ex.getResponse().getEntity().toString().contains("Invalid CSRF token"));
    }

    @Test
    public void testCSRFTokenValidationTokenMismatch() {
        String sessionToken = "session_789";
        CSRF_Token_Handler.generate(sessionToken);

        when(request.getHeader("X-CSRF-Token")).thenReturn("wrong_csrf_token");

        WebApplicationException ex = assertThrows(WebApplicationException.class, () -> {
            CSRF_Token_Handler.validate(request, sessionToken);
        });

        assertEquals(Response.Status.FORBIDDEN.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    public void testCSRFTokenValidationSessionNotFound() {
        when(request.getHeader("X-CSRF-Token")).thenReturn("some_token");

        WebApplicationException ex = assertThrows(WebApplicationException.class, () -> {
            CSRF_Token_Handler.validate(request, "unknown_session");
        });

        assertEquals(Response.Status.FORBIDDEN.getStatusCode(), ex.getResponse().getStatus());
    }

    @Test
    public void testCSRFTokenRemovalOnLogout() {
        String sessionToken = "session_logout";
        String csrfToken = CSRF_Token_Handler.generate(sessionToken);

        when(request.getHeader("X-CSRF-Token")).thenReturn(csrfToken);
        assertDoesNotThrow(() -> CSRF_Token_Handler.validate(request, sessionToken));

        CSRF_Token_Handler.remove(sessionToken);

        assertThrows(WebApplicationException.class, () -> {
            CSRF_Token_Handler.validate(request, sessionToken);
        });
    }

    @Test
    public void testCSRFTokenUniqueness() {
        String token1 = CSRF_Token_Handler.generate("sessionA");
        String token2 = CSRF_Token_Handler.generate("sessionB");
        assertNotEquals(token1, token2, "Generated CSRF tokens must be unique for different sessions");
    }
}
