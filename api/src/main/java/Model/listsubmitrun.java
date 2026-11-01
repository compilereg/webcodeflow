package Model;
import io.swagger.v3.oas.annotations.media.Schema;


@Schema(name = "ListSubmitRun", description = "Submitted run visible to the authenticated team")
public class listsubmitrun {

    @Schema(description = "PC2 site number", example = "1")
    private int siteNumber;
    
    @Schema(description = "Run number", example = "3")
    private int runNumber;
    
    @Schema(description = "Problem name", example = "problem1")
    private String problem;
    
    @Schema(description = "Programming language name", example = "Python")
    private String language;
    
    @Schema(description = "Current judgement or state of the run", example = "NEW")
    private String judgement;
    
    @Schema(description = "Whether the run has a final judgement", example = "false")
    private boolean finalJudged;
    
    @Schema(description = "Whether the run has a preliminary judgement", example = "false")
    private boolean preliminaryJudged;
    
    @Schema(description = "Whether the run solved the problem", example = "false")
    private boolean solved;
    
    @Schema(description = "Whether the run was deleted", example = "false")
    private boolean deleted;
    
    @Schema(description = "Submission time from PC2 contest clock", example = "125")
    private int submissionTime;

    public listsubmitrun() {
    }

    public listsubmitrun(
        int siteNumber,
        int runNumber,
        String problem,
        String language,
        String judgement,
        boolean finalJudged,
        boolean preliminaryJudged,
        boolean solved,
        boolean deleted,
        int submissionTime
    
    ) {
        this.siteNumber = siteNumber;
        this.runNumber = runNumber;
        this.problem = problem;
        this.language = language;
        this.judgement = judgement;
        this.finalJudged = finalJudged;
        this.preliminaryJudged = preliminaryJudged;
        this.solved = solved;
        this.deleted = deleted;
        this.submissionTime=submissionTime;
       
    }

    public int getSiteNumber() {
        return siteNumber;
    }

    public void setSiteNumber(int siteNumber) {
        this.siteNumber = siteNumber;
    }

    public int getRunNumber() {
        return runNumber;
    }

    public void setRunNumber(int runNumber) {
        this.runNumber = runNumber;
    }

    public String getProblem() {
        return problem;
    }

    public void setProblem(String problem) {
        this.problem = problem;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getJudgement() {
        return judgement;
    }

    public void setJudgement(String judgement) {
        this.judgement = judgement;
    }

    public boolean isFinalJudged() {
        return finalJudged;
    }

    public void setFinalJudged(boolean finalJudged) {
        this.finalJudged = finalJudged;
    }

    public boolean isPreliminaryJudged() {
        return preliminaryJudged;
    }

    public void setPreliminaryJudged(boolean preliminaryJudged) {
        this.preliminaryJudged = preliminaryJudged;
    }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
    public int getSubmissionTime() {
        return submissionTime;
    }

    public void setSubmissionTime(int submissionTime) {
        this.submissionTime = submissionTime;
    }
 
}