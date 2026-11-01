package standingutil;

import java.util.List;

public class StandingTeamObjModel {
	private String						teamName;
	private int 						teamExternalId;
	private int 						totalAttempts;
	private Boolean						isHonorable;
	private int 						index;
	private Boolean 					isGold;
	private Boolean						isSilver;
	private Boolean						isBronze;
	private Boolean						isHigh;
	private int 						solved;
	private int 						problemsAttempted;
	private int 						lastSolved;
	private int 						points;
	private String 						teamAlias;
	private int 						overallRank;
	private List<StandingProblemObjModel> 	problemSummaryInfo;
	private int 						firstSolved;
	private String 						shortSchoolName;
	private int 						teamId;
	private String 						teamKey;
	private Boolean 					isHighest;
	private int	 						rank;
	private int 						teamSiteId;
	
	/*
	 * Teaams grouping
	 * 
	 */
	private int							groupRank;
	private int							teamGroupExternalId;
	private String						teamGroupName;
	private int							scoringAdjustment;
	private int							teamGroupId;
	
	
	public int getTeamGroupId() {
		return teamGroupId;
	}

	public void setTeamGroupId(int teamGroupId) {
		this.teamGroupId = teamGroupId;
	}

	public int getScoringAdjustment() {
		return scoringAdjustment;
	}

	public void setScoringAdjustment(int scoringAdjustment) {
		this.scoringAdjustment = scoringAdjustment;
	}

	public String getTeamGroupName() {
		return teamGroupName;
	}

	public void setTeamGroupName(String teamGroupName) {
		this.teamGroupName = teamGroupName;
	}

	public int getTeamGroupExternalId() {
		return teamGroupExternalId;
	}

	public void setTeamGroupExternalId(int teamGroupExternalId) {
		this.teamGroupExternalId = teamGroupExternalId;
	}

	public int getGroupRank() {
		return groupRank;
	}
	
	public void setGroupRank(int groupRank) {
		this.groupRank = groupRank;
	}
	
	public Boolean getIsHonorable() {
		return isHonorable;
	}
	public void setIsHonorable(Boolean isHonorable) {
		this.isHonorable = isHonorable;
	}
	
	public String getTeamName() {
		return teamName;
	}
	public void setTeamName(String teamName) {
		this.teamName = teamName;
	}
	public int getTeamExternalId() {
		return teamExternalId;
	}
	public void setTeamExternalId(int teamExternalId) {
		this.teamExternalId = teamExternalId;
	}
	public int getTotalAttempts() {
		return totalAttempts;
	}
	public void setTotalAttempts(int totalAttempts) {
		this.totalAttempts = totalAttempts;
	}
	public int getIndex() {
		return index;
	}
	public void setIndex(int index) {
		this.index = index;
	}
	public Boolean getIsGold() {
		return isGold;
	}
	public void setIsGold(Boolean isGold) {
		this.isGold = isGold;
	}
	public int getSolved() {
		return solved;
	}
	public void setSolved(int solved) {
		this.solved = solved;
	}
	public int getProblemsAttempted() {
		return problemsAttempted;
	}
	public void setProblemsAttempted(int problemsAttempted) {
		this.problemsAttempted = problemsAttempted;
	}
	public int getLastSolved() {
		return lastSolved;
	}
	public void setLastSolved(int lastSolved) {
		this.lastSolved = lastSolved;
	}
	public int getPoints() {
		return points;
	}
	public void setPoints(int points) {
		this.points = points;
	}
	public String getTeamAlias() {
		return teamAlias;
	}
	public void setTeamAlias(String teamAlias) {
		this.teamAlias = teamAlias;
	}
	public int getOverallRank() {
		return overallRank;
	}
	public void setOverallRank(int overallRank) {
		this.overallRank = overallRank;
	}
	public List<StandingProblemObjModel> getProblemSummaryInfo() {
		return problemSummaryInfo;
	}
	public void setProblemSummaryInfo(List<StandingProblemObjModel> problemSummaryInfo) {
		this.problemSummaryInfo = problemSummaryInfo;
	}
	public int getFirstSolved() {
		return firstSolved;
	}
	public void setFirstSolved(int firstSolved) {
		this.firstSolved = firstSolved;
	}
	public String getShortSchoolName() {
		return shortSchoolName;
	}
	public void setShortSchoolName(String shortSchoolName) {
		this.shortSchoolName = shortSchoolName;
	}
	public int getTeamId() {
		return teamId;
	}
	public void setTeamId(int teamId) {
		this.teamId = teamId;
	}
	public String getTeamKey() {
		return teamKey;
	}
	public void setTeamKey(String teamKey) {
		this.teamKey = teamKey;
	}
	public Boolean getIsHighest() {
		return isHighest;
	}
	public void setIsHighest(Boolean isHighest) {
		this.isHighest = isHighest;
	}
	public int getRank() {
		return rank;
	}
	public void setRank(int rank) {
		this.rank = rank;
	}
	public int getTeamSiteId() {
		return teamSiteId;
	}
	public void setTeamSiteId(int teamSiteId) {
		this.teamSiteId = teamSiteId;
	}
	
	
	public StandingTeamObjModel() {
		//Nothing to do
	}
	
	public Boolean getIsSilver() {
		return isSilver;
	}

	public void setIsSilver(Boolean isSilver) {
		this.isSilver = isSilver;
	}
	
	
	public Boolean getIsBronze() {
		return isBronze;
	}

	public void setIsBronze(Boolean isBronze) {
		this.isBronze = isBronze;
	}

	public StandingTeamObjModel(String teamName, int teamExternalId, int totalAttempts, Boolean isHonorable, int index,
			Boolean isGold, int solved, int problemsAttempted, int lastSolved, int points, String teamAlias,
			int overallRank, List<StandingProblemObjModel> problemSummaryInfo, int firstSolved, String shortSchoolName,
			int teamId, String teamKey, Boolean isHighest, int rank, int teamSiteId, Boolean isSilver, Boolean isBronze, Boolean isHigh ) {
		super();
		this.teamName = teamName;
		this.teamExternalId = teamExternalId;
		this.totalAttempts = totalAttempts;
		this.isHonorable = isHonorable;
		this.index = index;
		this.isGold = isGold;
		this.solved = solved;
		this.problemsAttempted = problemsAttempted;
		this.lastSolved = lastSolved;
		this.points = points;
		this.teamAlias = teamAlias;
		this.overallRank = overallRank;
		this.problemSummaryInfo = problemSummaryInfo;
		this.firstSolved = firstSolved;
		this.shortSchoolName = shortSchoolName;
		this.teamId = teamId;
		this.teamKey = teamKey;
		this.isHighest = isHighest;
		this.rank = rank;
		this.teamSiteId = teamSiteId;
		this.isSilver = isSilver;
		this.isBronze = isBronze;
		this.isHigh = isHigh;
	}


	@Override
	public String toString() {
		return "StandingTeamObjModel [teamName=" + teamName + ", teamExternalId=" + teamExternalId + ", totalAttempts="
				+ totalAttempts + ", isHonorable=" + isHonorable + ", index=" + index + ", isGold=" + isGold
				+ ", isSilver=" + isSilver + ", isBronze=" + isBronze + ", isHigh=" + isHigh + ", solved=" + solved
				+ ", problemsAttempted=" + problemsAttempted + ", lastSolved=" + lastSolved + ", points=" + points
				+ ", teamAlias=" + teamAlias + ", overallRank=" + overallRank + ", problemSummaryInfo="
				+ problemSummaryInfo + ", firstSolved=" + firstSolved + ", shortSchoolName=" + shortSchoolName
				+ ", teamId=" + teamId + ", teamKey=" + teamKey + ", isHighest=" + isHighest + ", rank=" + rank
				+ ", teamSiteId=" + teamSiteId + ", groupRank=" + groupRank + ", teamGroupExternalId="
				+ teamGroupExternalId + ", teamGroupName=" + teamGroupName + ", scoringAdjustment=" + scoringAdjustment
				+ ", teamGroupId=" + teamGroupId + ", getTeamGroupId()=" + getTeamGroupId()
				+ ", getScoringAdjustment()=" + getScoringAdjustment() + ", getTeamGroupName()=" + getTeamGroupName()
				+ ", getTeamGroupExternalId()=" + getTeamGroupExternalId() + ", getGroupRank()=" + getGroupRank()
				+ ", getIsHonorable()=" + getIsHonorable() + ", getTeamName()=" + getTeamName()
				+ ", getTeamExternalId()=" + getTeamExternalId() + ", getTotalAttempts()=" + getTotalAttempts()
				+ ", getIndex()=" + getIndex() + ", getIsGold()=" + getIsGold() + ", getSolved()=" + getSolved()
				+ ", getProblemsAttempted()=" + getProblemsAttempted() + ", getLastSolved()=" + getLastSolved()
				+ ", getPoints()=" + getPoints() + ", getTeamAlias()=" + getTeamAlias() + ", getOverallRank()="
				+ getOverallRank() + ", getProblemSummaryInfo()=" + getProblemSummaryInfo() + ", getFirstSolved()="
				+ getFirstSolved() + ", getShortSchoolName()=" + getShortSchoolName() + ", getTeamId()=" + getTeamId()
				+ ", getTeamKey()=" + getTeamKey() + ", getIsHighest()=" + getIsHighest() + ", getRank()=" + getRank()
				+ ", getTeamSiteId()=" + getTeamSiteId() + ", getIsSilver()=" + getIsSilver() + ", getIsBronze()="
				+ getIsBronze() + ", getIsHigh()=" + getIsHigh() + ", getClass()=" + getClass() + ", hashCode()="
				+ hashCode() + ", toString()=" + super.toString() + "]";
	}

	public Boolean getIsHigh() {
		return isHigh;
	}

	public void setIsHigh(Boolean isHigh) {
		this.isHigh = isHigh;
	}

	
}
