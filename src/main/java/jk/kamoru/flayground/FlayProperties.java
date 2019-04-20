package jk.kamoru.flayground;

import java.io.File;

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

	private File   archivePath;
	private File   storagePath;
	private File[]   stagePaths;
	private File     coverPath;
	private File     queuePath;
	private File candidatePath;
	private File subtitlesPath;
	private File      infoPath;
	private File[] todayisPaths;
	private File[]   imagePaths;
	private File    backupPath;

	private File playerApp;
	private File editorApp;
	private File  paintApp;

	private String recyclebin = "FLAY_RECYCLEBIN";
	private boolean recyclebinUse = true;
	
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
