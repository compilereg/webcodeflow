package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "listProblems", description = "Problem summary returned by the API")
public class listProblems {

    @Schema(description = "Problem display name", example = "Two Sum")
    public String name;

    @Schema(description = "Problem short alphabet identifier", example = "A")
    public String alphabte;

    @Schema(description = "Whether the problem is marked as deleted", example = "false")
    public Boolean isDeleted = false;

    public listProblems() {
    }

    public listProblems(String name, String alphabte, Boolean isDeleted) {
        this.name = name;
        this.alphabte = alphabte;
        this.isDeleted = isDeleted;
    }
}