package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.Map.Entry;
import java.util.stream.Collectors;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.advice.TrackExecutionTime;
import jk.kamoru.flayground.base.web.socket.notice.AnnounceService;
import jk.kamoru.flayground.flay.Search;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import jk.kamoru.flayground.info.domain.History;
import jk.kamoru.flayground.info.domain.Tag;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.HistoryService;
import jk.kamoru.flayground.info.service.InfoService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayServiceImpl implements FlayService {

	@Autowired FlayProperties flayProperties;

	@Autowired FlaySource instanceFlaySource;
	@Autowired InfoService<Video, String> videoInfoService;
	@Autowired InfoService<Tag, Integer> tagInfoService;
	@Autowired HistoryService historyService;
	@Autowired FlayActionHandler flayActionHandler;
	@Autowired FlayFileHandler flayFileHandler;
	@Autowired CandidatesProvider candidatesProvider;
	@Autowired AnnounceService notificationService;
	@Autowired ScoreCalculator scoreCalculator;

	@Override
	public Flay get(String key) {
		return instanceFlaySource.get(key);
	}

	@Override
	public Collection<Flay> list() {
		return instanceFlaySource.list();
	}

	@Override
	public Collection<Flay> find(Search search) {
		return instanceFlaySource.list().stream().filter(f -> {
			return search.contains(f);
		}).collect(Collectors.toList());
	}

	@Override
	public Collection<Flay> find(String query) {
		return instanceFlaySource.list()
				.stream()
				.filter(f -> StringUtils.containsIgnoreCase(f.getFullname(), query))
				.sorted((f1, f2) -> StringUtils.compare(f2.getRelease(), f1.getRelease()))
				.collect(Collectors.toList());
	}

	@TrackExecutionTime(level = TrackExecutionTime.LEVEL.DEBUG)
	@Override
	public Collection<Flay> findByKeyValue(String field, String value) {
		if ("studio".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getStudio().equals(value)).collect(Collectors.toList());
		} else if ("title".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getTitle().contains(value)).collect(Collectors.toList());
		} else if ("actress".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getActressList().stream().anyMatch(a -> a.equals(value))).collect(Collectors.toList());
		} else if ("release".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getRelease().startsWith(value)).collect(Collectors.toList());
		} else if ("rank".equalsIgnoreCase(field)) {
			int rank = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getRank() == rank).collect(Collectors.toList());
		} else if ("play".equalsIgnoreCase(field)) {
			int play = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getPlay() == play).collect(Collectors.toList());
		} else if ("comment".equalsIgnoreCase(field)) {
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getComment().contains(value)).collect(Collectors.toList());
		} else if ("tag".equalsIgnoreCase(field)) {
			int id = Integer.parseInt(value);
			return instanceFlaySource.list().stream().filter(f -> f.getVideo().getTags().stream().anyMatch(t -> t.intValue() == id)).collect(Collectors.toList());
		} else {
			throw new IllegalStateException("unknown field");
		}
	}

	@Override
	public Collection<Flay> findCandidates() {
		return candidatesProvider.collect(instanceFlaySource.list());
	}

	@Override
	public void acceptCandidates(String opus) {
		Flay flay = instanceFlaySource.get(opus);
		List<File> candiList = flay.getFiles().get(Flay.CANDI);
		List<File> movieList = flay.getFiles().get(Flay.MOVIE);
		List<File> subtiList = flay.getFiles().get(Flay.SUBTI);

		File stagePath = flayProperties.getStagePaths()[0];
		for (File file : candiList) {
			String filename = file.getName();
			// 파일 종류에 따라 이동 위치 조정
			if (Flayground.FILE.isVideo(file)) {
				flayFileHandler.moveFileToDirectory(file, stagePath);
				movieList.add(new File(stagePath, filename));
			} else if (Flayground.FILE.isSubtitles(file)) {
				// 비디오 파일이 있으면, 그 위치로 이동
				File baseFolder = movieList.size() > 0 ? movieList.get(0).getParentFile() : stagePath;
				flayFileHandler.moveFileToDirectory(file, baseFolder);
				subtiList.add(new File(baseFolder, filename));
			} else {
				throw new IllegalStateException("file is not known suffix. " + file);
			}
		}
		candiList.clear();
		// Rank 조정
		if (flay.getVideo().getRank() < 0) {
			flay.getVideo().setRank(0);
		}
		// 전체 파일명 조정
		flayFileHandler.rename(flay);
		notificationService.announceTo("Accept candidates", flay.getFullname());
	}

	@Override
	public Collection<Flay> findByTagLike(Integer id) {
		Tag tag = tagInfoService.get(id);
		return instanceFlaySource.list().stream().filter(f -> {
			String full = tag.getName() + "," + tag.getDescription();
			return f.getVideo().getTags().contains(id) || StringUtils.containsAny(f.getFullname(), full.split(","));
		}).collect(Collectors.toList());
	}

	@Override
	public void play(String opus) {
		Flay flay = instanceFlaySource.get(opus);
		flayActionHandler.play(flay);

		flay.getVideo().increasePlayCount();

		videoInfoService.update(flay.getVideo());
		historyService.save(History.Action.PLAY, flay);
	}

	@Override
	public void edit(String opus) {
		flayActionHandler.edit(instanceFlaySource.get(opus));
	}

	@Override
	public void rename(String opus, Flay newFlay) {
		log.info("rename {}, {}", opus, newFlay.getFullname());
		if (!opus.equals(newFlay.getOpus())) {
			throw new IllegalArgumentException("Not allowed to change opus");
		}
		Flay flay = instanceFlaySource.get(opus);
		flayFileHandler.rename(flay, newFlay.getStudio(), newFlay.getTitle(), newFlay.getActressList(), newFlay.getRelease());
		notificationService.announceTo("Rename Flay", newFlay.getFullname());
	}

	@Override
	public void openFolder(String folder) {
		flayActionHandler.openFolder(folder);
	}

	@Override
	public void deleteFile(String file) {
		flayFileHandler.deleteFile(new File(file));
		log.warn("delete file {}", file);
	}

	@Override
	public Collection<Flay> getListOrderbyScoreDesc() {
		return scoreCalculator.listOrderByScoreDesc(instanceFlaySource.list());
	}

	@Override
	public void deleteFileOnFlay(String opus, String file) {
		// remove in Flay
		File deletedFile = new File(file);
		Flay flay = instanceFlaySource.get(opus);
		Set<Entry<String, List<File>>> entrySet = flay.getFiles().entrySet();
		for (Entry<String, List<File>> entry : entrySet) {
			List<File> fileList = entry.getValue();
			if (fileList.contains(deletedFile)) {
				fileList.remove(deletedFile);
			}
		}
		// delete
		deleteFile(file);
		// rename for assemble
		flayFileHandler.rename(flay);
	}

	@Override
	public Collection<Flay> getListOfLowScore() {
		final long storageLimit = flayProperties.getStorageLimit() * FileUtils.ONE_GB;
		List<Flay> lowScoreList = new ArrayList<>();
		long lengthSum = 0;
		for (Flay flay : scoreCalculator.listOrderByScoreDesc(instanceFlaySource.list())) {
			lengthSum += flay.getLength();
			if (lengthSum > storageLimit) {
				lowScoreList.add(flay);
			}
		}
		return lowScoreList;
	}

}
