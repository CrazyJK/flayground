package jk.kamoru.flayground.configure;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "flay")
public class FlayProperties {

	private boolean moveWatched = false;
	private boolean deleteLowerRank = false;
	private boolean deleteLowerScore = false;
	private int storageLimit = 7168;

	private String archivePath;
	private String storagePath;
	private String[] stagePath;
	private String coverPath;
	private String queuePath;
	private String candidatePath;
	private String subtitlesPath;
	private String infoPath;
	private String[] todayisPath;
	private String[] imagePath;
	private String backupPath;

	private String playerApp;
	private String editorApp;
	private String paintApp;

	public Boolean negateMoveWatched() {
		moveWatched = BooleanUtils.negate(moveWatched);
		return moveWatched;
	}

	public Boolean negateDeleteLowerRank() {
		deleteLowerRank = BooleanUtils.negate(deleteLowerRank);
		return deleteLowerRank;
	}

	public Boolean negateDeleteLowerScore() {
		deleteLowerScore = BooleanUtils.negate(deleteLowerScore);
		return deleteLowerScore;
	}
}
