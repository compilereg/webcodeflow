package exceptions;

import javax.ws.rs.core.Response;

public class LanguageNotFoundException extends ApiException {

    public LanguageNotFoundException(String message) {
        super(Response.Status.NOT_FOUND, message);
    }
}