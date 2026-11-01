package exceptions;

import org.junit.jupiter.api.Test;

import Model.APIErrorModel;

import javax.ws.rs.core.Response;
import static org.junit.jupiter.api.Assertions.*;

public class ExceptionsTest {

    @Test
    public void testMethodNotSupportedException() {
        MethodNotSupportedException ex = new MethodNotSupportedException("Method is blocked");
        assertEquals("Method is blocked", ex.getMessage());
        assertEquals(Response.Status.METHOD_NOT_ALLOWED, ex.getStatus());
    }

    @Test
    public void testNoCookieException() {
        NoCookieException ex = new NoCookieException("Auth cookie missing");
        assertEquals("Auth cookie missing", ex.getMessage());
        assertEquals(Response.Status.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    public void testNotVerifiedCookieException() {
        NotVerifiedCookieException ex = new NotVerifiedCookieException("Cookie is tampered");
        assertEquals("Cookie is tampered", ex.getMessage());
        assertEquals(Response.Status.UNAUTHORIZED, ex.getStatus());
        
        Throwable cause = new RuntimeException("JWT Invalid");
        NotVerifiedCookieException exWithCause = new NotVerifiedCookieException("Cookie is tampered", cause);
        assertEquals("Cookie is tampered", exWithCause.getMessage());
        assertEquals(cause, exWithCause.getCause());
        assertEquals(Response.Status.UNAUTHORIZED, exWithCause.getStatus());
    }

    @Test
    public void testPC2ServiceUnavailableException() {
        PC2ServiceUnavailableException ex = new PC2ServiceUnavailableException("PC2 server down");
        assertEquals("PC2 server down", ex.getMessage());
        assertEquals(Response.Status.SERVICE_UNAVAILABLE, ex.getStatus());
    }

    @Test
    public void testUnauthorizedSessionException() {
        UnauthorizedSessionException ex = new UnauthorizedSessionException("Session expired");
        assertEquals("Session expired", ex.getMessage());
        assertEquals(Response.Status.UNAUTHORIZED, ex.getStatus());
    }

    @Test
    public void testApiException() {
        ApiException ex = new ApiException(Response.Status.BAD_REQUEST, "Bad request payload");
        assertEquals("Bad request payload", ex.getMessage());
        assertEquals(Response.Status.BAD_REQUEST, ex.getStatus());
    }

    @Test
    public void testApiError() {
        APIErrorModel error = new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR, "Detailed error message");
        assertEquals("Error Type", error.getError());
        assertEquals("Detailed error message", error.getMessage());
    }

    @Test
    public void testClarificationBroadcastException() {
        Throwable cause = new RuntimeException("Socket closed");
        ClarificationBroadcastException ex = new ClarificationBroadcastException("Broadcast failed", cause);
        assertEquals("Broadcast failed", ex.getMessage());
        assertEquals(cause, ex.getCause());
    }

    @Test
    public void testLanguageNotFoundException() {
        LanguageNotFoundException ex = new LanguageNotFoundException("Language 'Python' not found");
        assertEquals("Language 'Python' not found", ex.getMessage());
        assertEquals(Response.Status.NOT_FOUND, ex.getStatus());
    }

    @Test
    public void testProblemNotFoundException() {
        ProblemNotFoundException ex = new ProblemNotFoundException("Problem 'A' not found");
        assertEquals("Problem 'A' not found", ex.getMessage());
        assertEquals(Response.Status.NOT_FOUND, ex.getStatus());
    }
}
