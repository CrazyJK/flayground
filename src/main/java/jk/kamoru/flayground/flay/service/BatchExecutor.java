package jk.kamoru.flayground.flay.service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map.Entry;
import java.util.stream.Collectors;

import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.History.Action;
import jk.kamoru.flayground.info.service.HistoryService;
import jk.kamoru.flayground.web.socket.notice.AnnounceService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BatchExecutor {

	public static enum Option {
		/** deleteLowerScoreVideo */ S;
	}

	public static enum Operation {
		/** InstanceVideoSource */ I, /** ArchiveVideoSource */ A, /** Backup */ B
	}

	@Autowired FlayProperties flayProperties;

	@Autowired FlaySource instanceFlaySource;
	@Autowired FlaySource  archiveFlaySource;
	@Autowired HistoryService historyService;
	@Autowired AnnounceService notificationService;
	@Autowired ScoreCalculator scoreCalculator;
	@Autowired FlayFileHandler flayFileHandler;

	public void reload() {
		log.info("[reload]");
		instanceFlaySource.load();
		notificationService.announce("Reload", "Instance Source");
	}

	public Boolean getOption(Option type) {
		switch (type) {
		case S:
			return flayProperties.isDeleteLowerScore();
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public Boolean toggleOption(Option type) {
		switch (type) {
		case S:
			return flayProperties.negateDeleteLowerScore();
		default:
			throw new IllegalArgumentException("unknown batch option");
		}
	}

	public void startBatch(Operation oper) {
		switch (oper) {
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

	protected void instanceBatch() {
		deleteLowerRank();

		if (flayProperties.isDeleteLowerScore())
			deleteLowerScore();

		assembleFlay();

		deleteEmptyFolder(ArrayUtils.addAll(flayProperties.getStagePaths(), flayProperties.getCoverPath()));

		instanceFlaySource.load();

		notificationService.announce("Batch", "Instance Source");
	}

	protected void archiveBatch() {
		log.info("[relocateArchiveFile]");
		for (Flay flay : archiveFlaySource.list()) {
			String yyyyMM = getArchiveFolderName(flay);
			File destDir = new File(flayProperties.getArchivePath(), yyyyMM);
			for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
				for (File file : entry.getValue()) {
					String parentName = file.getParentFile().getName();
					if (StringUtils.equals(parentName, yyyyMM)) {
						// ok. normal position
					} else {
						log.info("move {} to {}", file, destDir);
						flayFileHandler.moveFileToDirectory(file, destDir);
					}
				}
			}
		}

		deleteEmptyFolder(flayProperties.getArchivePath());

		archiveFlaySource.load();

		notificationService.announce("Batch", "Archive Source");
	}

	void deleteLowerRank() {
		log.info("[deleteLowerRank]");
		for (Flay flay : instanceFlaySource.list()) {
			if (flay.getVideo().getRank() < 0) {
				log.info("lower rank {}", flay.getOpus());
				archiving(flay);
			}
		}
	}

	void deleteLowerScore() {
		log.info("[deleteLowerScore] {} GB", flayProperties.getStorageLimit());
		final long storageSize = flayProperties.getStorageLimit() * FileUtils.ONE_GB;

		long lengthSum = 0;
		List<Flay> scoreReverseSortedFlayList = instanceFlaySource.list().stream()
				.filter(f -> f.getFiles().get(Flay.MOVIE).size() > 0 && f.getVideo().getRank() > 0 && f.getVideo().getPlay() > 0)
				.sorted((f1, f2) -> scoreCalculator.compare(f1, f2))
				.collect(Collectors.toList());
		for (Flay flay : scoreReverseSortedFlayList) {
			lengthSum += flay.getLength();
			if (lengthSum > storageSize) {
				log.info("lower score {} score={} over {}", flay.getOpus(), scoreCalculator.calc(flay), flayFileHandler.prettyFileLength(lengthSum));
				archiving(flay);
			}
		}
	}

	void assembleFlay() {
		log.info("[assembleFlay]");

		final String storagePath;
		final String[] stagePaths;
		final String   coverPath;
		try {
			storagePath  = flayProperties.getStoragePath().getCanonicalPath();
			stagePaths = new String[flayProperties.getStagePaths().length];
			for (int i=0; i<flayProperties.getStagePaths().length; i++) {
				stagePaths[i] = flayProperties.getStagePaths()[i].getCanonicalPath();
			}
			coverPath = flayProperties.getCoverPath().getCanonicalPath();
		} catch (IOException e) {
			throw new IllegalStateException("assembleFlay CanonicalPath error", e);
		}

		for (Flay flay : instanceFlaySource.list()) {
			if (flay.isArchive()) {
				continue;
			}
			File delegatePath = getDelegatePath(flay, storagePath, stagePaths, coverPath);
			for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
				String key = entry.getKey();
				if (Flay.CANDI.equals(key)) {
					continue;
				}
				List<File> value = entry.getValue();
				for (File file : value) {
					if (!delegatePath.equals(file.getParentFile())) {
						log.info("move [{}] {} to {}", flay.getOpus(), file, delegatePath);
						flayFileHandler.moveFileToDirectory(file, delegatePath);
					}
				}
			}
		}
	}

	/**
	 * 하위 폴더 전체에서 파일이 없는 폴더 삭제
	 * @param emptyManagedPaths
	 */
	void deleteEmptyFolder(File...emptyManagedPaths) {
		log.info("[deleteEmptyFolder]");
		for (File path : emptyManagedPaths) {
			Collection<File> listDirs = flayFileHandler.listDirectory(path);
			for (File dir : listDirs) {
				if (dir.equals(path)) {
					continue;
				}
				int dirSize  = flayFileHandler.listDirectory(dir).size();
				int fileSize = FileUtils.listFiles(dir, null, false).size();
				log.debug("  {}, dir: {}, file: {}", dir, dirSize, fileSize);
				if (dirSize == 1 && fileSize == 0) {
					log.info("    empty directory delete {}", dir);
					flayFileHandler.deleteDirectory(dir);
				}
			}
		}
	}

	/**
	 * flay 파일이 있어야될 위치
	 * @param flay
	 * @param storagePath
	 * @param stagePaths
	 * @param coverPath
	 * @return
	 * @throws IOException
	 */
	private File getDelegatePath(Flay flay, String storagePath, String[] stagePaths, String coverPath) {
		int movieSize = flay.getFiles().get(Flay.MOVIE).size();
		int coverSize = flay.getFiles().get(Flay.COVER).size();

		try {
			if (movieSize > 0) {
				String flayMovieFileFolder = flay.getFiles().get(Flay.MOVIE).get(0).getParentFile().getCanonicalPath();
				int rank = flay.getVideo().getRank();
				if (rank > 0) { // storage에 [studio]로 있어야 한다
					return new File(storagePath, flay.getStudio());
				} else if (rank == 0) { // stage에 있어야 한다
					// 같은 디스크의 stage 찾아
					String root = flayMovieFileFolder.substring(0, 1);
					String stagePath = null;
					for (String path : stagePaths) {
						if (path.startsWith(root)) {
							stagePath = path;
							break;
						}
					}
					// stage/[연도]
					if (stagePath != null) {
						return new File(stagePath, flay.getRelease().substring(0, 4));
					}
				} else { // rank < 0 있으면 안되지

				}
			} else if (coverSize > 0) { // 비디오 없는 파일은 cover 로
				return new File(coverPath, flay.getRelease().substring(0, 4));
			}
		} catch (IOException e) {
			throw new IllegalStateException("getDelegatePath CanonicalPath error", e);
		}

		log.info("Not determine delegate path, return to Queue path. {}", flay.getOpus());
		return flayProperties.getQueuePath();
	}

	/**
	 * archive 폴더명
	 * yyyy-MM 형식
	 * @param flay
	 * @return
	 */
	private String getArchiveFolderName(Flay flay) {
		return StringUtils.substring(flay.getRelease(), 0, 4) + "-" + StringUtils.substring(flay.getRelease(), 5, 7);
	}

	/**
	 * 커버, 자막은 아카이브 폴더로 이동<br>
	 * 그외 파일은 제거.(삭제 또는 휴지통)
	 * @param flay
	 */
	private void archiving(Flay flay) {
		String yyyyMM = getArchiveFolderName(flay);
		File archiveDir = new File(flayProperties.getArchivePath(), yyyyMM);
		for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
			String key = entry.getKey();
			for (File file : entry.getValue()) {
				if (Flay.COVER.equals(key) || Flay.SUBTI.equals(key)) {
					log.info("move {} to {}", file, archiveDir);
					flayFileHandler.moveFileToDirectory(file, archiveDir);
				} else {
					log.info("delete {}", file);
					flayFileHandler.deleteFile(file);
				}
			}
		}
		flay.setArchive(true);
		historyService.save(Action.DELETE, flay);
	}

	public synchronized void backup() {
		if (!flayProperties.getBackupPath().exists()) {
			log.warn("Backup path is wrong");
			return;
		}
		log.info("[Backup] START {}", flayProperties.getBackupPath());

		final String CSV_HEADER = "Studio,Opus,Title,Actress,Released,Rank,Fullname";
		final String CSV_FORMAT = "\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%s,\"%s\"";

		final String BACKUP_INSTANCE_JAR_FILENAME = flayProperties.getBackup().getInstanceJarFilename();
		final String BACKUP_ARCHIVE_JAR_FILENAME  = flayProperties.getBackup().getArchiveJarFilename();
		final String BACKUP_INSTANCE_CSV_FILENAME = flayProperties.getBackup().getInstanceCsvFilename();
		final String BACKUP_ARCHIVE_CSV_FILENAME  = flayProperties.getBackup().getArchiveCsvFilename();

		File backupInstanceJarFile = new File(flayProperties.getBackupPath(), BACKUP_INSTANCE_JAR_FILENAME);
		File backupArchiveJarFile  = new File(flayProperties.getBackupPath(), BACKUP_ARCHIVE_JAR_FILENAME);
		File backupRootPath = new File(flayProperties.getQueuePath(), "InstanceBackupTemp");
		File backupInstanceFilePath = new File(backupRootPath, "instanceFiles");

		flayFileHandler.createDirectory(backupRootPath);
		flayFileHandler.cleanDirectory(backupRootPath);
		flayFileHandler.createDirectory(backupInstanceFilePath);
		flayFileHandler.cleanDirectory(flayProperties.getBackupPath());

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
		log.info("[Backup] Copy Info folder {} to {}", flayProperties.getInfoPath(), backupRootPath);
		flayFileHandler.copyDirectoryToDirectory(flayProperties.getInfoPath(), backupRootPath);

		// Cover, Subtitlea file copy
		log.info("[Backup] Copy Instance file to {}", backupInstanceFilePath);
		for (Flay flay : instanceFlayList) {
			for (File file : flay.getFiles().get(Flay.COVER))
				flayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
			for (File file : flay.getFiles().get(Flay.SUBTI))
				flayFileHandler.copyFileToDirectory(file, backupInstanceFilePath);
		}
//		for (Flay flay : archiveFlayList) {
//			for (File file : flay.getFiles().get(Flay.COVER))
//				FlayFileHandler.copyFileToDirectory(file, backupFilePath);
//			for (File file : flay.getFiles().get(Flay.SUBTI))
//				FlayFileHandler.copyFileToDirectory(file, backupFilePath);
//		}

		log.info("[Backup] Compress Instance folder");
		compress(backupInstanceJarFile, backupRootPath);

		log.info("[Backup] Compress Archive folder");
		compress(backupArchiveJarFile, flayProperties.getArchivePath());

		log.info("[Backup] Delete Instance Backup Temp folder {}", backupRootPath);
		flayFileHandler.deleteDirectory(backupRootPath);

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

	private void compress(File destJarFile, File targetFolder) {
		/*
		 * jar options
		 * -c  새 아카이브를 생성합니다.
		 * -v  표준 출력에 상세 정보 출력을 생성합니다.
		 * -f  아카이브 파일 이름을 지정합니다.
		 * -0  저장 전용: ZIP 압축을 사용하지 않습니다.
		 * -M  항목에 대해 Manifest 파일을 생성하지 않습니다.
		 */
		List<String> commands = Arrays.asList("jar", "cvf0M", destJarFile.getAbsolutePath(), "-C", targetFolder.getAbsolutePath(), ".");
		File logFile = new File(destJarFile.getParentFile(), destJarFile.getName() + "." + Flayground.Format.Date.YYYY_MM_DD.format(new Date()) + ".log");
		ProcessBuilder builder = new ProcessBuilder(commands);
		builder.redirectOutput(Redirect.to(logFile));
		builder.redirectError(Redirect.INHERIT);
		try {
			log.info("         jar {}", commands);
			Process process = builder.start();
			process.waitFor();
			log.info("         completed {}", flayFileHandler.prettyFileLength(destJarFile.length()));
		} catch (IOException | InterruptedException e) {
			throw new IllegalStateException("Fail to jar", e);
		}
	}

}
