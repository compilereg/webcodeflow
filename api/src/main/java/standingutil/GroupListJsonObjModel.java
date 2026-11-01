package standingutil;

public class GroupListJsonObjModel {
	private String 						externalId;
	private int							id;
	private int							included;
	private int							teamCount;
	private String						title;
	
	public String getExternalId() {
		return externalId;
	}
	public void setExternalId(String externalId) {
		this.externalId = externalId;
	}
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public int getIncluded() {
		return included;
	}
	public void setIncluded(int included) {
		this.included = included;
	}
	public int getTeamCount() {
		return teamCount;
	}
	public void setTeamCount(int teamCount) {
		this.teamCount = teamCount;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public GroupListJsonObjModel(String externalId, int id, int included, int teamCount, String title) {
		super();
		this.externalId = externalId;
		this.id = id;
		this.included = included;
		this.teamCount = teamCount;
		this.title = title;
	}
	
	
	public GroupListJsonObjModel() {
		super();

	}
	
	
	@Override
	public String toString() {
		return "GroupListJsonObjModel [externalId=" + externalId + ", id=" + id + ", included=" + included
				+ ", teamCount=" + teamCount + ", title=" + title + "]";
	}
	
	
}
