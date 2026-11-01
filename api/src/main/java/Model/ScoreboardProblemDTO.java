package Model;

public class ScoreboardProblemDTO {

    private int problemId;
    private String problemName;
    private String shortName;
    private boolean solved;
    private long attempts;
    private long solutionTime;
    private long penalty;

    public ScoreboardProblemDTO() {
    }

    public ScoreboardProblemDTO(
        int problemId,
        String problemName,
        String shortName,
        boolean solved,
        long attempts,
        long solutionTime,
        long penalty
    ) {
        this.problemId = problemId;
        this.problemName = problemName;
        this.shortName = shortName;
        this.solved = solved;
        this.attempts = attempts;
        this.solutionTime = solutionTime;
        this.penalty = penalty;
    }

    public int getProblemId() {
        return problemId;
    }

    public void setProblemId(int problemId) {
        this.problemId = problemId;
    }

    public String getProblemName() {
        return problemName;
    }

    public void setProblemName(String problemName) {
        this.problemName = problemName;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public boolean isSolved() {
        return solved;
    }

    public void setSolved(boolean solved) {
        this.solved = solved;
    }

    public long getAttempts() {
        return attempts;
    }

    public void setAttempts(long attempts) {
        this.attempts = attempts;
    }

    public long getSolutionTime() {
        return solutionTime;
    }

    public void setSolutionTime(long solutionTime) {
        this.solutionTime = solutionTime;
    }

    public long getPenalty() {
        return penalty;
    }

    public void setPenalty(long penalty) {
        this.penalty = penalty;
    }
}