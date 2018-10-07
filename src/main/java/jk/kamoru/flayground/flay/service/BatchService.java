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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.History.Action;
import jk.kamoru.flayground.info.service.HistoryService;
import jk.kamoru.flayground.notice.service.NotificationService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BatchService {

	public static enum Option {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S;
	}
	
	public static enum Operation {
		/** moveWatchedVideo */ W, /** deleteLowerRankVideo */ R, /** deleteLowerScoreVideo */ S,
		/** InstanceVideoSource */ I, /** ArchiveVideoSource */ A, /** Backup */ B
	}
	
	public static final String BACKUP_INSTANCE_JAR_FILENAME = "flayground-instance.jar";
	public static final String BACKUP_ARCHIVE_JAR_FILENAME  = "flayground-archive.jar";
	public static final String BACKUP_INSTANCE_CSV_FILENAME = "flay-instance.csv";
	public static final String BACKUP_ARCHIVE_CSV_FILENAME  = "flay-archive.csv";

	@Autowired FlaySource instanceFlaySource;
	@Autowired FlaySource  archiveFlaySource;
	@Autowired HistoryService historyService;
	@Autowired NotificationService notificationService;

	@Value("${batch.watch.move}")   Boolean moveWatched;
	@Value("${batch.rank.delete}")  Boolean deleteLowerRank;
	@Value("${batch.score.delete}") Boolean deleteLowerScore;
	
	@Value("${path.video.archive}") String   archivePath;
    @Value("${path.video.storage}") String   storagePath;
    @Value("${path.video.stage}")   String[]   stagePaths;
    @Value("${path.video.cover}")   String[]   coverPaths;
    @Value("${path.video.queue}")   String     queuePath;
	@Value("${path.info}")          String      infoPath;
    @Value("${path.backup}")        String    backupPath;
    @Value("${path.video.stage},${path.video.cover}") String[] emptyManagedInstancePath;
    
    @Value("${size.storage}") int storageGbSize;
	
	public void reload() {
		log.info("[reload]");
		instanceFlaySource.load();
		notificationService.announce("Reload", "Instance Source");
	}

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
			instanceBatch();
			break;
		case A:
			archiveBatch();
			break;
		case B: 
			backup();
			break;
		default:
			throw new IllegalArgumentException("unknown batch operation");
		}
		
	}

	private void instanceBatch() {
		if (moveWatched)
			moveWatched();
		if (deleteLowerRank)
			deleteLowerRank();
		if (deleteLowerScore)
			deleteLowerScore();
		
		assembleFlay();
		deleteEmptyFolder(emptyManagedInstancePath);
		instanceFlaySource.load();
		notificationService.announce("Batch", "Instance Source");
	}

	private void archiveBatch() {
		relocateArchiveFile();
		deleteEmptyFolder(archivePath);
		archiveFlaySource.load();
		notificationService.announce("Batch", "Archive Source");
	}

	private void relocateArchiveFile() {
		log.info("[relocateArchiveFile]");
		for (Flay flay : archiveFlaySource.list()) {
			String yyyyMM = getArchiveFolder(flay);
			File destDir = new File(archivePath, yyyyMM);
			for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
				for (File file : entry.getValue()) {
					String parentName = file.getParentFile().getName();
					if (StringUtils.equals(parentName, yyyyMM)) {
						// ok. normal position
					} else {
						log.info("move {} to {}", file, destDir);
						FlayFileHandler.moveFileToDirectory(file, destDir);
					}
				}
			}
		}
	}

	private String getArchiveFolder(Flay flay) {
		return StringUtils.substring(flay.getRelease(), 0, 4) + "-" + StringUtils.substring(flay.getRelease(), 5, 7);
	}

	private void moveWatched() {
		log.info("[moveWatched]");
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() > 0 && flay.getVideo().getPlay() > 0) {
				for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
					for (File file : entry.getValue()) {
						if (!file.getPath().startsWith(storagePath)) {
							File destDir = new File(storagePath, flay.getStudio());
							log.info("move {} to {}", file, destDir);
							FlayFileHandler.moveFileToDirectory(file, destDir);
						}
					}
				}
			}
		}
	}

	private void deleteLowerRank() {
		log.info("[deleteLowerRank]");
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() < 0) {
				log.info("lower rank {}", flay.getOpus());
				archiving(flay);
			}
		}
	}

	private void deleteLowerScore() {
		log.info("[deleteLowerScore]");
		long lengthSum = 0;
		long storageSize = storageGbSize * FileUtils.ONE_GB;
		List<Flay> sorted = instanceFlaySource.list().stream()
				.filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0 && f.getVideo().getRank() > 0 && f.getVideo().getPlay() > 0)
				.sorted((f1, f2) -> ScoreCalculator.compare(f2, f1))
				.collect(Collectors.toList());
		for (Flay flay : sorted) {
			lengthSum += flay.getLength();
			if (lengthSum > storageSize) {
				log.info("lower score {} score={} over {}", flay.getOpus(), ScoreCalculator.calc(flay), FlayFileHandler.prettyFileLength(lengthSum));
				archiving(flay);
			}
		}
	}

	private void assembleFlay() {
		log.info("[assembleFlay]");
		for (Flay flay : instanceFlaySource.list()) {
			File delegatePath = getDelegatePath(flay);
			log.debug("assemble {} : {}", flay.getOpus(), delegatePath);
			for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
				// String key = entry.getKey();
				List<File> value = entry.getValue();
				for (File file : value) {
					if (!delegatePath.equals(file.getParentFile())) {
						log.info("move [{}] {} to {}", flay.getOpus(), file, delegatePath);
						FlayFileHandler.moveFileToDirectory(file, delegatePath);
					}
				}
			}
		}
	}

	private File getDelegatePath(Flay flay) {
		int movieSize = flay.getFiles().get(Flay.MOVIE).size();
		int coverSize = flay.getFiles().get(Flay.COVER).size();
		
		if (movieSize > 0) {
			String path = flay.getFiles().get(Flay.MOVIE).get(0).getParent();
			if (StringUtils.equalsAny(path, stagePaths)) { // stage 같은 경로에 있으면, 날자 sub폴더
				return new File(path, flay.getRelease().substring(0, 4));
			} else if (StringUtils.equals(path, storagePath)) { // storage 같은 경로에 있으면, studio sub폴더
				return new File(path, flay.getStudio());
			} else if (StringUtils.startsWithAny(path, stagePaths) || StringUtils.startsWith(path, storagePath)) { // 하위에 있으면 현폴더
				return new File(path);
			}
		} else if (coverSize > 0) {
			String path = flay.getFiles().get(Flay.COVER).get(0).getParent();
			if (StringUtils.equalsAny(path, coverPaths)) { // cover 같은 경로에 있으면, 날자 sub폴더 
				return new File(path, flay.getRelease().substring(0, 4));
			} else if (StringUtils.startsWithAny(path, coverPaths)) { // 하위 경로에 있으면, 현폴더
				return new File(path);
			}
		}
		
		log.info("Not determine delegate path, move to Queue. {}", flay.getOpus());
		return new File(queuePath);
	}

	private void deleteEmptyFolder(String...emptyManagedPath) {
		log.info("[deleteEmptyFolder]");
		List<Path> paths = new ArrayList<>();
		for (String dir : emptyManagedPath) {
			try {
				Path start = Paths.get(dir);
				Files.walkFileTree(start, new SimpleFileVisitor<Path>() {

					@Override
					public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
						if (!start.equals(dir) && !Files.newDirectoryStream(dir).iterator().hasNext()) {
							paths.add(dir);
						}
						return super.preVisitDirectory(dir, attrs);
					}});
			} catch (IOException e) {
				throw new IllegalStateException("deleteEmptyFolder walk fail", e);
			}
		}
		for (Path dir : paths) {
			log.info("empty directory delete {}", dir);
			FlayFileHandler.deleteDirectory(dir.toFile());
		}
	}

	private void archiving(Flay flay) {
		String yyyyMM = getArchiveFolder(flay);
		File destDir = new File(archivePath, yyyyMM);
		for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
			String key = entry.getKey();
			for (File file : entry.getValue()) {
				if (Flay.COVER.equals(key) || Flay.SUBTI.equals(key)) {
					log.info("move {} to {}", file, destDir);
					FlayFileHandler.moveFileToDirectory(file, destDir);
				} else {
					log.info("delete {}", file);
					FlayFileHandler.deleteFile(file);
				}
			}
		}
		historyService.save(Action.DELETE, flay);
	}
	
	public synchronized void backup() {
		if (StringUtils.isBlank(backupPath)) {
			log.warn("Backup path not set");
			return;
		}
		log.info("[Backup] START {}", backupPath);

		final String CSV_HEADER = "Studio,Opus,Title,Actress,Released,Rank,Fullname";
		final String CSV_FORMAT = "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\"";

		File backupInstanceJarFile = new File(backupPath, BACKUP_INSTANCE_JAR_FILENAME);
		File backupArchiveJarFile  = new File(backupPath, BACKUP_ARCHIVE_JAR_FILENAME);
		File backupRootPath = new File(queuePath, "backup_" + FlayConfig.YYYY_MM_DD_Format.format(new Date()));
		File backupInstanceFilePath = new File(backupRootPath, "instance");
		FlayFileHandler.createDirectory(backupRootPath);
		FlayFileHandler.cleanDirectory(backupRootPath);
		FlayFileHandler.createDirectory(backupInstanceFilePath);

		// video list backup to csv
		Collection<Flay> instanceFlayList = instanceFlaySource.list();
		Collection<Flay>  archiveFlayList =  archiveFlaySource.list();
		List<History>    historyList = historyService.list();

		List<String>    instanceList = new ArrayList<>();
		List<String>     archiveList = new ArrayList<>();

		// instance info
		log.info("[Backup] Write instance csv {} to {}", BACKUP_INSTANCE_CSV_FILENAME, backupRootPath);
		instanceList.add(CSV_HEADER);
		for (Flay flay : instanceFlayList) {
			instanceList.add(String.format(CSV_FORMAT, 
					flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(), flay.getVideo().getRank(), flay.getFullname()));
		}
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_INSTANCE_CSV_FILENAME), instanceList); 
		
		// archive info
		log.info("[Backup] Write archive  csv {}  to {}", BACKUP_ARCHIVE_CSV_FILENAME, backupRootPath);
		archiveList.add(CSV_HEADER);
		for (Flay flay : archiveFlayList) {
			archiveList.add(String.format(CSV_FORMAT, 
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
				archiveList.add(String.format(CSV_FORMAT, "", history.getOpus(), "", "", "", "", history.getDesc()));
		}
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_ARCHIVE_CSV_FILENAME),  archiveList);

		// Info folder copy
		log.info("[Backup] Copy Info folder {} to {}", infoPath, backupRootPath);
		FlayFileHandler.copyDirectoryToDirectory(new File(infoPath), backupRootPath);
		
		// Cover, Subtitlea file copy
		log.info("[Backup] Copy Instance file to {}", backupInstanceFilePath);
		for (Flay flay : instanceFlayList) {
			for (File file : flay.getFiles().get(Flay.COVER))
				FlayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
			for (File file : flay.getFiles().get(Flay.SUBTI))
				FlayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
		}
//		for (Flay flay : archiveFlayList) {
//			for (File file : flay.getFiles().get(Flay.COVER))
//				FlayFileHandler.copyFileToDirectory(file, backupFilePath);
//			for (File file : flay.getFiles().get(Flay.SUBTI))
//				FlayFileHandler.copyFileToDirectory(file, backupFilePath);
//		}
		
		log.info("[Backup] Compress Instance folder");
		compress(backupRootPath, backupInstanceJarFile);
		
		log.info("[Backup] Compress Archive folder");
		compress(new File(archivePath), backupArchiveJarFile);

		log.info("[Backup] Delete Instance folder {}", backupRootPath);
		FlayFileHandler.deleteDirectory(backupRootPath);
		
		notificationService.announce("Backup", "Flay source");

		log.info("[Backup] END");
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

	private void compress(File srcPath, File destinationFile) {
		List<String> commands = Arrays.asList("jar", "c0fM", destinationFile.getAbsolutePath(), "-C", srcPath.getAbsolutePath(), ".");
		File logFile = new File(srcPath.getParentFile(), srcPath.getName() + ".log");
		ProcessBuilder builder = new ProcessBuilder(commands);
		builder.redirectOutput(Redirect.to(logFile));
		builder.redirectError(Redirect.INHERIT);
		try {
			log.info("         jar {}", commands);
			Process process = builder.start();
			process.waitFor();
			log.info("         completed {}", FlayFileHandler.prettyFileLength(destinationFile.length()));
		} catch (IOException | InterruptedException e) {
			throw new IllegalStateException("Fail to jar", e);
		}
	}

}
