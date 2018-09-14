package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;

@Service
public class BatchService {

	public static enum Option {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S;
	}
	
	public static enum Operation {
		/** InstanceVideoSource */ I, /** ArchiveVideoSource */ A, 
		/** Backup */ B, /** deleteEmptyFolder */ D;
	}
	
	@Autowired FlaySource instanceFlaySource;
	@Autowired FlaySource  archiveFlaySource;
		
	@Value("${batch.watch.move}") Boolean moveWatched;
	@Value("${batch.rank.delete}") Boolean deleteLowerRank;
	@Value("${batch.score.delete}") Boolean deleteLowerScore;
	
	@Value("${path.video.archive}") String archivePath;
    @Value("${path.video.storage}") String storagePath;
    @Value("${path.video.stage}") String[] stagePaths;
    @Value("${path.video.cover}") String[] coverPaths;
	
	public Boolean getOption(Option type) {
		switch (type) {
		case W:
			return moveWatched;
		case R:
			return deleteLowerRank;
		case S:
			return deleteLowerScore;
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public Boolean toggleOption(Option type) {
		switch (type) {
		case W:
			return moveWatched = BooleanUtils.negate(moveWatched);
		case R:
			return deleteLowerRank = BooleanUtils.negate(deleteLowerRank);
		case S:
			return deleteLowerScore = BooleanUtils.negate(deleteLowerScore);
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public void startBatch(Operation oper) {
		switch (oper) {
		case I:
			instanceSource();
			break;
		case A:
			archiveSource();
			break;
		case B: 
			backup();
			break;
		case D:
			deleteEmptyFolder();
			break;
		default:
			throw new IllegalArgumentException("unknown batch operation");
		}
		
	}

	private void instanceSource() {
		if (moveWatched)
			moveWatched();
		if (deleteLowerRank)
			deleteLowerRank();
		if (deleteLowerScore)
			deleteLowerScore();
		deleteEmptyFolder();
		reload();
	}

	private void archiveSource() {
		// TODO Auto-generated method stub
		
		archiveFlaySource.load();
	}

	private void moveWatched() {
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() > 0 && flay.getVideo().getPlay() > 0) {
				for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
					for (File file : entry.getValue()) {
						if (!file.getPath().startsWith(storagePath)) {
							moveFileToDirectory(file, new File(storagePath, flay.getStudio()));
						}
					}
				}
			}
		}
	}

	private void deleteLowerRank() {
		String yyyyMM = FlayConfig.YYYY_MM_Format.format(new Date());
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() < 0) {
				for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
					String key = entry.getKey();
					for (File file : entry.getValue()) {
						if (Flay.COVER.equals(key)) {
							moveFileToDirectory(file, new File(archivePath, yyyyMM));
						} else {
							FileUtils.deleteQuietly(file);
						}
					}
				}
			}
		}
	}

	private void deleteLowerScore() {
		instanceFlaySource.list().stream().sorted((f1, f2) -> NumberUtils.compare(ScoreCalculator.calc(f1), ScoreCalculator.calc(f2)));
		
	}

	public void reload() {
		instanceFlaySource.load();
	}

	private void deleteEmptyFolder() {
		// TODO Auto-generated method stub
		
	}

	private void backup() {
		// TODO Auto-generated method stub
		
	}

	void moveFileToDirectory(File file, File dir) {
		try {
			FileUtils.moveFileToDirectory(file, dir, true);
		} catch (IOException e) {
			throw new IllegalStateException("fail to move file:" + file.getName(), e);
		}
	}
}
