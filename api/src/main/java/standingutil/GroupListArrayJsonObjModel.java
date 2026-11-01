package standingutil;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;


public class GroupListArrayJsonObjModel {
	
	@JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "group")
    @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
	@JsonSetter(nulls = Nulls.AS_EMPTY, contentNulls = Nulls.AS_EMPTY)
	private List<GroupListJsonObjModel> group;

	public List<GroupListJsonObjModel> getGroup() {
		return group;
	}

	public void setGroup(List<GroupListJsonObjModel> group) {
		this.group = group;
	}

	public GroupListArrayJsonObjModel(List<GroupListJsonObjModel> group) {
		super();
		this.group = group;
	}

	@Override
	public String toString() {
		return "GroupListArrayJsonObjModel [group=" + group + "]";
	}
	
	public GroupListArrayJsonObjModel() {
		super();
	
	}

	
}
