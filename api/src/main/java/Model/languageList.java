package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "languageList", description = "Programming language entry returned by the API")
public class languageList {

    @Schema(description = "Internal language name", example = "java")
    public String languageName;

    @Schema(description = "Display title of the language", example = "Java 17")
    public String title;

    public languageList() {
    }

    public languageList(String languageName, String title) {
        this.languageName = languageName;
        this.title = title;
    }
}