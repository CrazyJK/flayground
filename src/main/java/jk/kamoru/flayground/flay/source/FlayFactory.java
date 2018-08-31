package jk.kamoru.flayground.flay.source;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.service.ActressInfoService;
import jk.kamoru.flayground.info.service.VideoInfoService;
import lombok.Data;

@Component
public class FlayFactory {

	@Autowired VideoInfoService videoInfoService;
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
	class Result {
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
		flay.setActressList(newActressList(result.actress));
		flay.setRelease(result.release);
		flay.setVideo(videoInfoService.getOrNew(result.opus));
		return flay;
	}

	private List<Actress> newActressList(String actress) {
		List<Actress> list = new ArrayList<>();
		for (String name : StringUtils.split(actress, ",")) {
			String onePerson = "";
			for (String str : StringUtils.split(name)) {
				onePerson += str + " ";
			}
			list.add(actressInfoService.getOrNew(onePerson.trim()));
		}
		return list;
	}

	public void addFile(Flay flay, File file) {
		String suffix = StringUtils.substringAfterLast(file.getName(), ".").toLowerCase();
		if (FlayConfig.SUFFIX_VIDEO.contains(suffix)) {
			flay.addMovieFile(file);
		} else if (FlayConfig.SUFFIX_SUBTITLES.contains(suffix)) {
			flay.addSubtitlesFile(file);
		} else if (FlayConfig.SUFFIX_IMAGE.contains(suffix)) {
			flay.setCoverFile(file);
		}
	}
	
}
