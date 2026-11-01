package utilities;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class MultiFileDecodeResult extends ValidationResult {

    private File mainTempFile;
    private String mainOriginalFileName;
    private byte[] mainFileBytes;

    private final List<File> additionalTempFiles = new ArrayList<>();
    private final List<String> additionalOriginalFileNames = new ArrayList<>();

    public File getMainTempFile() {
        return mainTempFile;
    }

    public void setMainTempFile(File mainTempFile) {
        this.mainTempFile = mainTempFile;
    }

    public String getMainOriginalFileName() {
        return mainOriginalFileName;
    }

    public void setMainOriginalFileName(String mainOriginalFileName) {
        this.mainOriginalFileName = mainOriginalFileName;
    }

    public byte[] getMainFileBytes() {
        return mainFileBytes;
    }

    public void setMainFileBytes(byte[] mainFileBytes) {
        this.mainFileBytes = mainFileBytes;
    }

    public List<File> getAdditionalTempFiles() {
        return additionalTempFiles;
    }

    public List<String> getAdditionalOriginalFileNames() {
        return additionalOriginalFileNames;
    }
}