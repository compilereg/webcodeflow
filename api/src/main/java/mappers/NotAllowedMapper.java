package mappers;

import javax.ws.rs.NotAllowedException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import Model.APIErrorModel;

@Provider
public class NotAllowedMapper implements ExceptionMapper<NotAllowedException> {

    @Override
    public Response toResponse(NotAllowedException exception) {
        APIErrorModel error = new APIErrorModel(
        		Response.Status.METHOD_NOT_ALLOWED,
            "HTTP method is not supported for this endpoint."
        );

        return Response.status(Response.Status.METHOD_NOT_ALLOWED)
            .entity(error)
            .type(MediaType.APPLICATION_JSON)
            .build();
    }
}