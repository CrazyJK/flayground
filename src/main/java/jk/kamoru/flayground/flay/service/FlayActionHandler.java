package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.io.IOException;
import java.lang.ProcessBuilder.Redirect;
import java.util.ArrayList;
import java.util.Arrays;
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
	
	@Async
	public void play(Flay flay) {
		exec(composite(flayConfig.getPlayer(), flay.getFiles().get(Flay.MOVIE)));
		
		int play = flay.getVideo().getPlay();
		flay.getVideo().setPlay(++play);
	}

	@Async
	public void edit(Flay flay) {
		exec(composite(flayConfig.getEditer(), flay.getFiles().get(Flay.SUBTI)));
	}

	@Async
	public void openFolder(String folder) {
		String explorer = "";
		switch(FlayConfig.SYSTEM) {
		case WINDOWS:
			explorer = "explorer";
			break;
		case LINUX:
			explorer = "nemo";
			break;
		case MAC:
			throw new IllegalStateException("Max not supported");
		default:
			throw new IllegalStateException("no specified OS");
		}

		File file = new File(folder);
		if (file.isDirectory()) {
			exec(Arrays.asList(explorer, file.getAbsolutePath()));
		} else {
			exec(Arrays.asList(explorer, file.getParent()));
		}
	}

	private void exec(List<String> commands) {
		log.info("exec {}", commands);
		try {
			ProcessBuilder builder = new ProcessBuilder(commands);
			builder.redirectOutput(Redirect.INHERIT);
			builder.redirectError(Redirect.INHERIT);
			builder.start();
		} catch (IOException e) {
			log.error("exec error", e);
			throw new IllegalStateException("exec error", e);
		}
	}

	private List<String> composite(String command, List<File> files) {
		List<String> commands = new ArrayList<>();
		commands.add(command);
		for (File file : files) {
			commands.add(file.getAbsolutePath());
		}
		return commands;
	}

}
