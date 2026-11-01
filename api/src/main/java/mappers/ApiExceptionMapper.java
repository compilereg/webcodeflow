package mappers;

import exceptions.ApiException;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import Model.APIErrorModel;

@Provider
public class ApiExceptionMapper implements ExceptionMapper<ApiException> {

    @Override
    public Response toResponse(ApiException exception) {
        APIErrorModel error = new APIErrorModel(
            exception.getStatus(),exception.getMessage()
        );

        return Response.status(exception.getStatus())
            .entity(error)
            .type(MediaType.APPLICATION_JSON)
            .build();
    }
}