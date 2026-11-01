package standingutil;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;

public class StandingHeaderObjModel {
	private int 		totalTeams;
	private int 		siteCount;
	private int 		problemCount;
	private int 		totalAttempts;
	private String		currentDate;
	private int 		medianProblemsSolved;
	//private String		groupList;
	private String 		elapsedtime;
	private int 		problemsAttempted;
	private String		systemURL;
	private String 		title;
	private String		systemVersion;
	private String 		scoreboardMessage;
	private int			groupCount;
	private String 		systemName;
	private int			totalSolved;
	private String		remainingtime;
	private List<ProblemJsonObjModel>	problem;
	

	private GroupListArrayJsonObjModel groupList;
	
	@JacksonXmlProperty(localName = "groupList")
	public GroupListArrayJsonObjModel getGroupList() {
		return groupList;
	}

	@JsonSetter(nulls = Nulls.SET)
	@JacksonXmlProperty(localName = "groupList")
	public void setGroupList(Object groupList) {
        if (groupList instanceof GroupListArrayJsonObjModel) {
            this.groupList = (GroupListArrayJsonObjModel) groupList;
        } else {
            this.groupList = null;
        }
    }

	public int problemCount() {
		return problem.size();
	}
	
	public int getTotalTeams() {
		return totalTeams;
	}
	public void setTotalTeams(int totalTeams) {
		this.totalTeams = totalTeams;
	}
	public int getSiteCount() {
		return siteCount;
	}
	public void setSiteCount(int siteCount) {
		this.siteCount = siteCount;
	}
	public int getProblemCount() {
		return problemCount;
	}
	public void setProblemCount(int problemCount) {
		this.problemCount = problemCount;
	}
	public int getTotalAttempts() {
		return totalAttempts;
	}
	public void setTotalAttempts(int totalAttempts) {
		this.totalAttempts = totalAttempts;
	}
	public String getCurrentDate() {
		return currentDate;
	}
	public void setCurrentDate(String currentDate) {
		this.currentDate = currentDate;
	}
	public int getMedianProblemsSolved() {
		return medianProblemsSolved;
	}
	public void setMedianProblemsSolved(int medianProblemsSolved) {
		this.medianProblemsSolved = medianProblemsSolved;
	}
	
	public String getElapsedtime() {
		return elapsedtime;
	}
	public void setElapsedtime(String elapsedtime) {
		this.elapsedtime = elapsedtime;
	}
	public int getProblemsAttempted() {
		return problemsAttempted;
	}
	public void setProblemsAttempted(int problemsAttempted) {
		this.problemsAttempted = problemsAttempted;
	}
	public String getSystemURL() {
		return systemURL;
	}
	public void setSystemURL(String systemURL) {
		this.systemURL = systemURL;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public String getSystemVersion() {
		return systemVersion;
	}
	public void setSystemVersion(String systemVersion) {
		this.systemVersion = systemVersion;
	}
	public String getScoreboardMessage() {
		return scoreboardMessage;
	}
	public void setScoreboardMessage(String scoreboardMessage) {
		this.scoreboardMessage = scoreboardMessage;
	}
	public int getGroupCount() {
		return groupCount;
	}
	public void setGroupCount(int groupCount) {
		this.groupCount = groupCount;
	}
	public String getSystemName() {
		return systemName;
	}
	public void setSystemName(String systemName) {
		this.systemName = systemName;
	}
	public int getTotalSolved() {
		return totalSolved;
	}
	public void setTotalSolved(int totalSolved) {
		this.totalSolved = totalSolved;
	}
	public String getRemainingtime() {
		return remainingtime;
	}
	public void setRemainingtime(String remainingtime) {
		this.remainingtime = remainingtime;
	}
	public List<ProblemJsonObjModel> getProblem() {
		return problem;
	}
	public void setProblem(List<ProblemJsonObjModel> problem) {
		this.problem = problem;
	}
	public StandingHeaderObjModel(int totalTeams, int siteCount, int problemCount, int totalAttempts,
			String currentDate, int medianProblemsSolved, String elapsedtime, int problemsAttempted,
			String systemURL, String title, String systemVersion, String scoreboardMessage, int groupCount,
			String systemName, int totalSolved, String remainingtime, List<ProblemJsonObjModel> problem, GroupListArrayJsonObjModel groupList) {
		super();
		this.totalTeams = totalTeams;
		this.siteCount = siteCount;
		this.problemCount = problemCount;
		this.totalAttempts = totalAttempts;
		this.currentDate = currentDate;
		this.medianProblemsSolved = medianProblemsSolved;
		this.groupList = groupList;
		this.elapsedtime = elapsedtime;
		this.problemsAttempted = problemsAttempted;
		this.systemURL = systemURL;
		this.title = title;
		this.systemVersion = systemVersion;
		this.scoreboardMessage = scoreboardMessage;
		this.groupCount = groupCount;
		this.systemName = systemName;
		this.totalSolved = totalSolved;
		this.remainingtime = remainingtime;
		this.problem = problem;
	}
	
	public StandingHeaderObjModel() {
		//Nothing to do here
	}

}
