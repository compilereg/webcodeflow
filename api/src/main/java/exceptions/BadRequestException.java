package exceptions;

import javax.ws.rs.core.Response;

public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(Response.Status.BAD_REQUEST, message);
    }
}