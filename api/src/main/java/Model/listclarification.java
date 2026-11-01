package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "listclarification", description = "Clarification record returned by the API")
public class listclarification {

    @Schema(description = "Team name", example = "team01")
    public String teamname;

    @Schema(description = "Clarification unique identifier", example = "15")
    public int ClarificationId;

    @Schema(description = "Clarification submission time in contest time format", example = "3600")
    public int ClarificationTime;

    @Schema(description = "Clarification status", example = "answered")
    public String Status;

    @Schema(description = "Problem name", example = "A")
    public String ProblemName;

    @Schema(description = "Clarification question", example = "Can input contain negative values?")
    public String Question;

    @Schema(description = "Clarification answer", example = "Yes, negative values are allowed.")
    public String Answer;

    public listclarification() {
    }

    public listclarification(
        String teamname,
        int clarificationId,
        int clarificationTime,
        String status,
        String problemName,
        String question,
        String answer
    ) {
        this.teamname = teamname;
        this.ClarificationId = clarificationId;
        this.ClarificationTime = clarificationTime;
        this.Status = status;
        this.ProblemName = problemName;
        this.Question = question;
        this.Answer = answer;
    }
}