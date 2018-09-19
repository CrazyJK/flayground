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
	public static final String BACKUP_FILENAME = "flayground.jar";
	
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
		
		assembleFlay();
		deleteEmptyFolder();
		reload();
	}

	private void archiveSource() {
		// TODO Auto-generated method stub
		
		archiveFlaySource.load();
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
							moveFileToDirectory(file, destDir);
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
		log.info("[reload]");
		instanceFlaySource.load();
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
						log.info("move {} to {}", flay.getOpus(), file);
						moveFileToDirectory(file, delegatePath);
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

	private void deleteEmptyFolder() {
		log.info("deleteEmptyFolder");
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

		final String CSV_HEADER = "Studio,Opus,Title,Actress,Released,Rank,Fullname";
		final String CSV_FORMAT = "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\"";

		File backupFile     = new File(backupPath, BACKUP_FILENAME);
		File backupRootPath = new File(queuePath, "backup_" + FlayConfig.YYYY_MM_DD_Format.format(new Date()));
		File backupFilePath = new File(backupRootPath, "file");
		createDirectory(backupRootPath);
		cleanDirectory(backupRootPath);
		createDirectory(backupFilePath);

		// video list backup to csv
		Collection<Flay> instanceFlayList = instanceFlaySource.list();
		Collection<Flay>  archiveFlayList =  archiveFlaySource.list();
		List<History>    historyList = historyService.list();

		List<String>    instanceList = new ArrayList<>();
		List<String>     archiveList = new ArrayList<>();

		// instance info
		log.info("Backup Instance {}", BACKUP_INSTANCE_FILENAME);
		instanceList.add(CSV_HEADER);
		for (Flay flay : instanceFlayList) {
			instanceList.add(String.format(CSV_FORMAT, 
					flay.getStudio(), flay.getOpus(), flay.getTitle(), flay.getActressName(), flay.getRelease(), flay.getVideo().getRank(), flay.getFullname()));
		}
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_INSTANCE_FILENAME), instanceList); 
		
		// archive info
		log.info("Backup Archive  {}", BACKUP_ARCHIVE_FILENAME);
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
		writeFileWithUTF8BOM(new File(backupRootPath, BACKUP_ARCHIVE_FILENAME),  archiveList);

		// Info folder copy
		log.info("Backup Info     {}", infoPath);
		copyDirectoryToDirectory(new File(infoPath), backupRootPath);
		
		// Cover, Subtitlea file copy
		log.info("Backup File     {}", backupFilePath);
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
		
		log.info("Backup Compress {}", backupFile);
		compress(backupRootPath, backupFile);

		log.info("Backup END");
	}
	
	private void createDirectory(File directory) {
		try {
			Files.createDirectories(directory.toPath());
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}

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
			FileUtils.copyFileToDirectory(srcFile, destFile);
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
		List<String> commands = Arrays.asList("jar", "cvfM", destinationFile.getAbsolutePath(), "-C", srcFile.getAbsolutePath(), ".");
		File logFile = new File(srcFile.getParentFile(), srcFile.getName() + ".log");
		ProcessBuilder builder = new ProcessBuilder(commands);
		builder.redirectOutput(Redirect.to(logFile));
		builder.redirectError(Redirect.INHERIT);
		try {
			log.info("compress {}", commands);
			Process process = builder.start();
			process.waitFor();
			log.info("compress completed");
			deleteDirectory(srcFile);
			log.info("compress src delete");
		} catch (IOException | InterruptedException e) {
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
