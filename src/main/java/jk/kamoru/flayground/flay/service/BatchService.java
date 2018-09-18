package jk.kamoru.flayground.flay.service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.nio.charset.Charset;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map.Entry;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.service.HistoryService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BatchService {

	public static enum Option {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S;
	}
	
	public static enum Operation {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S,
		/** InstanceVideoSource */ I, /** ArchiveVideoSource */ A, 
		/** Backup */ B, /** deleteEmptyFolder */ D;
	}
	
	public static final String BACKUP_INSTANCE_FILENAME = "flay-instance.csv";
	public static final String BACKUP_ARCHIVE_FILENAME = "flay-archive.csv";
	public static final String BACKUP_FILENAME = "flayground.zip";
	
	@Autowired FlaySource instanceFlaySource;
	@Autowired FlaySource  archiveFlaySource;
	@Autowired HistoryService historyService;
		
	@Value("${batch.watch.move}")   Boolean moveWatched;
	@Value("${batch.rank.delete}")  Boolean deleteLowerRank;
	@Value("${batch.score.delete}") Boolean deleteLowerScore;
	
	@Value("${path.video.archive}") String archivePath;
    @Value("${path.video.storage}") String storagePath;
    @Value("${path.video.stage}")   String[] stagePaths;
    @Value("${path.video.cover}")   String[] coverPaths;
    @Value("${path.video.queue}")   String   queuePath;
	@Value("${path.info}")          String    infoPath;
    @Value("${path.backup}")        String  backupPath;
    @Value("${path.video.archive},${path.video.stage},${path.video.cover}") String[] emptyManagedPath;
    
    @Value("${size.storage}") int storageGbSize;
	
	String yyyyMM = FlayConfig.YYYY_MM_Format.format(new Date());

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
		case W:
			moveWatched();
			break;
		case R:
			deleteLowerRank();
			break;
		case S:
			deleteLowerScore();
			break;
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
							File destDir = new File(storagePath, flay.getStudio());
							log.info("move {} to {}", file, destDir);
							moveFileToDirectory(file, destDir);
						}
					}
				}
			}
		}
	}

	private void deleteLowerRank() {
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() < 0) {
				log.info("lower rank {}", flay.getOpus());
				archiving(flay);
			}
		}
	}

	private void deleteLowerScore() {
		long lengthSum = 0;
		long storageSize = storageGbSize * FileUtils.ONE_GB;
		List<Flay> sorted = instanceFlaySource.list().stream().sorted((f1, f2) -> NumberUtils.compare(ScoreCalculator.calc(f2), ScoreCalculator.calc(f1))).collect(Collectors.toList());
		for (Flay flay : sorted) {
			lengthSum += flay.getLength();
			if (lengthSum > storageSize) {
				log.info("lower score {} {}", flay.getOpus(), ScoreCalculator.calc(flay));
				archiving(flay);
			}
		}
	}

	public void reload() {
		instanceFlaySource.load();
	}

	private void deleteEmptyFolder() {
		List<Path> paths = new ArrayList<>();
		for (String dir : emptyManagedPath) {
			try {
				Path start = Paths.get(dir);
				Files.walkFileTree(start, new SimpleFileVisitor<Path>() {

					@Override
					public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
						if (!start.equals(dir) 
								&& !Files.newDirectoryStream(dir).iterator().hasNext()) {
							paths.add(dir);
						}
						return super.preVisitDirectory(dir, attrs);
					}});
			} catch (IOException e) {
				throw new IllegalStateException("deleteEmptyFolder walk fail", e);
			}
		}
		for (Path dir : paths) {
			try {
				FileUtils.deleteDirectory(dir.toFile());
				log.info("empty directory deleted {}", dir);
			} catch (IOException e) {
				throw new IllegalStateException("deleteEmptyFolder delete fail", e);
			}
		}
	}

	public synchronized void backup() {
		if (StringUtils.isBlank(backupPath)) {
			log.warn("Backup path not set");
			return;
		}
		log.info("Backup START [{}]", backupPath);

		File backupFile = new File(backupPath, BACKUP_FILENAME);
		File backupRootPath = new File(queuePath, "backup_" + FlayConfig.YYYY_MM_DD_Format.format(new Date()));
		File backupInfoPath = new File(backupRootPath, "info");
		File backupFilePath = new File(backupRootPath, "file");
		createDirectory(backupRootPath);
		createDirectory(backupInfoPath);
		createDirectory(backupFilePath);
		
		final String csvHeader = "Studio, Opus, Title, Actress, Released, Rank, Fullname";
		final String csvFormat = "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\"";

		// video list backup to csv
		Collection<Flay> instanceFlayList = instanceFlaySource.list();
		Collection<Flay>  archiveFlayList =  archiveFlaySource.list();
		List<History>    historyList = historyService.list();

		List<String>    instanceList = new ArrayList<>();
		List<String>     archiveList = new ArrayList<>();

		// instance info
		instanceList.add(csvHeader);
		for (Flay flay : instanceFlayList) {
			instanceList.add(
					String.format(csvFormat, 
							flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(), flay.getVideo().getRank(), flay.getFullname()));
		}
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_INSTANCE_FILENAME), instanceList); 
		
		// archive info
		archiveList.add(csvHeader);
		for (Flay flay : archiveFlayList) {
			archiveList.add(
					String.format(csvFormat, 
							flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(), "", flay.getFullname()));
		}
		for (History history : historyList) {
			String opus = history.getOpus();
			boolean foundInArchive = false;
			for (Flay flay : archiveFlayList) {
				if (flay.getOpus().equals(opus)) {
					foundInArchive = true;
					break;
				}
			}
			if (!foundInArchive)
				archiveList.add(String.format(csvFormat, "", history.getOpus(), "", "", "", "", history.getDesc()));
		}
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_ARCHIVE_FILENAME),  archiveList);

		// Info folder copy
		copyDirectoryToDirectory(new File(infoPath), backupInfoPath);
		
		// Cover, Subtitlea file copy
		for (Flay flay : instanceFlayList) {
			for (File file : flay.getFiles().get(Flay.COVER))
				copyFileToDirectory(file, backupFilePath);
			for (File file : flay.getFiles().get(Flay.SUBTI))
				copyFileToDirectory(file, backupFilePath);
		}
		for (Flay flay : archiveFlayList) {
			for (File file : flay.getFiles().get(Flay.COVER))
				copyFileToDirectory(file, backupFilePath);
			for (File file : flay.getFiles().get(Flay.SUBTI))
				copyFileToDirectory(file, backupFilePath);
		}
		
		compress(backupRootPath, backupFile);
		
		deleteDirectory(backupRootPath);

		log.info("Backup END");
	}
	
	private void createDirectory(File directory) {
		try {
			Files.createDirectories(directory.toPath());
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	@SuppressWarnings("unused")
	private void cleanDirectory(File directory) {
		try {
			FileUtils.cleanDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	private void deleteDirectory(File directory) {
		try {
			FileUtils.deleteDirectory(directory);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	private void copyDirectoryToDirectory(File srcDir, File destDir) {
		try {
			FileUtils.copyDirectoryToDirectory(srcDir, destDir);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	private void copyFileToDirectory(File srcFile, File destFile) {
		try {
			FileUtils.copyFile(srcFile, destFile);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

	private void moveFileToDirectory(File file, File dir) {
		try {
			FileUtils.moveFileToDirectory(file, dir, true);
		} catch (IOException e) {
			throw new IllegalStateException("fail to move file:" + file.getName(), e);
		}
	}
	
	private void writeFileWithUTF8BOM(File file, Collection<String> lines) {
		try (BufferedWriter bufferedWriter = Files.newBufferedWriter(file.toPath(), Charset.forName("UTF-8"), StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
			bufferedWriter.write(65279); // UTF-8의 BOM인 "EF BB BF"를 UTF-16BE 로 변환
			for (String line : lines) {
				bufferedWriter.write(line);
				bufferedWriter.newLine();
			}
			bufferedWriter.flush();
		} catch (IOException e) {
			throw new IllegalStateException("Fail to writeFileWithUTF8BOM", e);
		}
	}

	private void compress(File srcFile, File destinationFile) {
		List<String> commands = Arrays.asList("jar", "cvf", destinationFile.getAbsolutePath(), srcFile.getAbsolutePath());
		ProcessBuilder builder = new ProcessBuilder(commands);
		builder.redirectOutput(Redirect.INHERIT);
		builder.redirectError(Redirect.INHERIT);
		try {
			builder.start();
		} catch (IOException e) {
			throw new IllegalStateException("Fail to jar", e);
		}
	}

	void archiving(Flay flay) {
		for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
			String key = entry.getKey();
			for (File file : entry.getValue()) {
				if (Flay.COVER.equals(key)) {
					File destDir = new File(archivePath, yyyyMM);
					log.info("move {} to {}", file, destDir);
					moveFileToDirectory(file, destDir);
				} else {
					log.info("delete {}", file);
					FileUtils.deleteQuietly(file);
				}
			}
		}
	}

}
