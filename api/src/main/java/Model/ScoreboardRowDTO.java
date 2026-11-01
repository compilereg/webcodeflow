package Model;

import java.util.ArrayList;
import java.util.List;

public class ScoreboardRowDTO {

    private String teamName;
    private int rank;
    private int solved;
    private int penalty;

    private List<ScoreboardProblemDTO> problems =
            new ArrayList<ScoreboardProblemDTO>();
    
    
    public ScoreboardRowDTO() {
    }

    public ScoreboardRowDTO(
        String teamName,
        int rank,
        int solved,
        int penalty
    ) {
        this.teamName = teamName;
        this.rank = rank;
        this.solved = solved;
        this.penalty = penalty;
    }

    
    
    public ScoreboardRowDTO(
            String teamName,
            int rank,
            int solved,
            int penalty,
            List<ScoreboardProblemDTO> problems
        ) {
            this.teamName = teamName;
            this.rank = rank;
            this.solved = solved;
            this.penalty = penalty;
            this.problems = problems;
        }

    
    
    
    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public int getSolved() {
        return solved;
    }

    public void setSolved(int solved) {
        this.solved = solved;
    }

    public int getPenalty() {
        return penalty;
    }

    public void setPenalty(int penalty) {
        this.penalty = penalty;
    }
    
    
    // ADDED
    public List<ScoreboardProblemDTO> getProblems() {
        return problems;
    }

    // ADDED
    public void setProblems(
        List<ScoreboardProblemDTO> problems
    ) {
    	this.problems =
    	        problems == null
    	            ? new ArrayList<>()
    	            : new ArrayList<>(problems);
    }
}