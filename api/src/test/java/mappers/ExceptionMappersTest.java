package mappers;

import exceptions.ApiException;
import javax.ws.rs.NotAllowedException;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import Model.APIErrorModel;

import static org.junit.jupiter.api.Assertions.*;

public class ExceptionMappersTest {

    @Test
    public void testApiExceptionMapper() {
        ApiExceptionMapper mapper = new ApiExceptionMapper();
        ApiException exception = new ApiException(Response.Status.UNAUTHORIZED, "Invalid authentication token.");

        Response response = mapper.toResponse(exception);
        assertNotNull(response);
        assertEquals(Response.Status.UNAUTHORIZED.getStatusCode(), response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_TYPE, response.getMediaType());

        APIErrorModel errorObj = (APIErrorModel) response.getEntity();
        assertNotNull(errorObj);
        assertEquals("Unauthorized", errorObj.getError());
        assertEquals("Invalid authentication token.", errorObj.getMessage());
    }

    @Test
    public void testNotAllowedMapper() {
        NotAllowedMapper mapper = new NotAllowedMapper();
        NotAllowedException exception = new NotAllowedException("HTTP method not allowed");

        Response response = mapper.toResponse(exception);
        assertNotNull(response);
        assertEquals(Response.Status.METHOD_NOT_ALLOWED.getStatusCode(), response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_TYPE, response.getMediaType());

        APIErrorModel errorObj = (APIErrorModel) response.getEntity();
        assertNotNull(errorObj);
        assertEquals("Method Not Allowed", errorObj.getError());
        assertEquals("HTTP method is not supported for this endpoint.", errorObj.getMessage());
    }

    @Test
    public void testThrowableMapperWithWebApplicationException() {
        ThrowableMapper mapper = new ThrowableMapper();
        WebApplicationException exception = new WebApplicationException("Custom bad request parameter", 400);

        Response response = mapper.toResponse(exception);
        assertNotNull(response);
        assertEquals(400, response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_TYPE, response.getMediaType());

        APIErrorModel errorObj = (APIErrorModel) response.getEntity();
        assertNotNull(errorObj);
        assertEquals("Bad Request", errorObj.getError());
        assertEquals("Custom bad request parameter", errorObj.getMessage());
    }

    @Test
    public void testThrowableMapperWithGenericException() {
        ThrowableMapper mapper = new ThrowableMapper();
        NullPointerException exception = new NullPointerException("Null pointer reference");

        Response response = mapper.toResponse(exception);
        assertNotNull(response);
        assertEquals(Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(), response.getStatus());
        assertEquals(MediaType.APPLICATION_JSON_TYPE, response.getMediaType());

        APIErrorModel errorObj = (APIErrorModel) response.getEntity();
        assertNotNull(errorObj);
        assertEquals("Internal Server Error", errorObj.getError());
        assertEquals("An unexpected internal server error occurred.", errorObj.getMessage());
    }
}
