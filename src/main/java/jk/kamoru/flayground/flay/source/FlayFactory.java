package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;

import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.domain.Video;
import jk.kamoru.flayground.info.service.ActressInfoService;
import jk.kamoru.flayground.info.service.StudioInfoService;
import jk.kamoru.flayground.info.service.VideoInfoService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FlayFactory {

	@Autowired  StudioInfoService  studioInfoService;
	@Autowired   VideoInfoService   videoInfoService;
	@Autowired ActressInfoService actressInfoService;
	
	public Result parse(File file) {
		Result result = new Result();
		String rowData = file.getName();
		String[] parts = StringUtils.split(rowData, "]");
		if (parts == null || parts.length < 5) {
			result.valid = false;
		} else {
			result.valid = true;
			result.studio  = StringUtils.replace(parts[0], "[", "");
			result.opus    = StringUtils.replace(parts[1], "[", "");
			result.title   = StringUtils.replace(parts[2], "[", "");
			result.actress = StringUtils.replace(parts[3], "[", "");
			result.release = StringUtils.replace(parts[4], "[", "");
		}
		return result;
	}

	@Data
	public static class Result {
		boolean valid;
		String studio;
		String opus;
		String title;
		String actress;
		String release;
	}

	public Flay newFlay(Result result) {
		Flay flay = new Flay();
		flay.setStudio(result.studio);
		flay.setOpus(result.opus);
		flay.setTitle(result.title);
		flay.setActressList(getActressList(result.actress));
		flay.setRelease(result.release);
		flay.setVideo(getVideo(result.opus));
		return flay;
	}

	private Video getVideo(String opus) {
		return videoInfoService.getOrNew(opus);
	}

	private List<String> getActressList(String actress) {
		List<String> list = new ArrayList<>();
		for (String name : StringUtils.split(actress, ",")) {
			String onePerson = "";
			for (String str : StringUtils.split(name)) {
				onePerson += str + " ";
			}
			list.add(actressInfoService.getOrNew(onePerson.trim()).getName());
		}
		return list;
	}

	public void addFile(Flay flay, File file) {
		String suffix = FilenameUtils.getExtension(file.getName());
		if (Flayground.Suffix.Video.contains(suffix)) {
			flay.addMovieFile(file);
		} else if (Flayground.Suffix.Subtitles.contains(suffix)) {
			flay.addSubtitlesFile(file);
		} else if (Flayground.Suffix.Image.contains(suffix)) {
			flay.addCoverFile(file);
		} else {
			log.warn("unknown file {} -> {}", flay.getOpus(), file);
		}
	}
	
}
