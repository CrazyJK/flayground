package jk.kamoru.flayground;

import org.apache.commons.lang3.BooleanUtils;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "flay")
public class FlayProperties {

	private Backup backup = new Backup();
	private Score score = new Score();

	private boolean moveWatched = false;
	private boolean deleteLowerRank = false;
	private boolean deleteLowerScore = false;
	private int storageLimit = 7168;

	private String   archivePath;
	private String   storagePath;
	private String[]   stagePaths;
	private String     coverPath;
	private String     queuePath;
	private String candidatePath;
	private String subtitlesPath;
	private String      infoPath;
	private String[] todayisPaths;
	private String[]   imagePaths;
	private String    backupPath;

	private String playerApp;
	private String editorApp;
	private String  paintApp;

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

	@Data
	public static class Backup {
		private String instanceJarFilename = "flayground-instance.jar";
		private String archiveJarFilename  = "flayground-archive.jar";
		private String instanceCsvFilename = "flay-instance.csv";
		private String archiveCsvFilename  = "flay-archive.csv";
	}

	@Data
	public static class Score {
		private int rankPoint = 20;
		private int playPoint = 1;
		private int subtitlesPoint = 50;
	}

}
