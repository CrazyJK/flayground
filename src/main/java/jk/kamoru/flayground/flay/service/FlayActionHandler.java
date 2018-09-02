package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import jk.kamoru.flayground.FlayConfig;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class FlayActionHandler {

	@Autowired FlayConfig flayConfig;
	
	public void play(Flay flay) {
		exec(flayConfig.getPlayer(), flay.getMovieFileList());
		
		int play = flay.getVideo().getPlay();
		flay.getVideo().setPlay(++play);
	}

	public void edit(Flay flay) {
		exec(flayConfig.getEditer(), flay.getSubtitlesFileList());
	}
	
	@Async
	public void exec(String command, List<File> files) {
		log.info("exec {}, {}", command, files);
		try {
			List<String> commands = new ArrayList<>();
			commands.add(command);
			for (File file : files) {
				commands.add(file.getAbsolutePath());
			}
			ProcessBuilder builder = new ProcessBuilder(commands);
			builder.redirectOutput(Redirect.INHERIT);
			builder.redirectError(Redirect.INHERIT);
			builder.start();
		} catch (IOException e) {
			log.error("exec error", e);
			throw new IllegalStateException("exec error", e);
		}
	}

}
