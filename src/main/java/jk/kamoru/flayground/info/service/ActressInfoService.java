package jk.kamoru.flayground.info.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map.Entry;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.domain.Actress;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ActressInfoService extends InfoServiceAdapter<Actress, String> {

	@Autowired FlayService flayService;

	@Override
	public void update(Actress update) {
		super.update(update);
	}

	public void rename(Actress actress, String oldName) {
		if (actress.getName().equals(oldName)) {
			super.update(actress);
		} else { // 이름이 바꼈다
			log.info("rename {} to {}", oldName, actress.getName());
			if (super.infoSource.contains(actress.getName())) { // 있는 이름이다 
				super.update(actress);
			} else { // 새이름이다
				super.create(actress);
			}
			// 파일에서 이름을 변경하기
			Collection<Flay> listByActress = flayService.findByKeyValue("actress", oldName);
			log.info("{} found {}", oldName, listByActress.size());

			for (Flay flay : listByActress) {
				String originalName = flay.getFullname();
				
				// replace name
				List<String> actressList = flay.getActressList();
				actressList.remove(oldName);
				actressList.add(actress.getName());

				String newName = flay.getFullname();
				// rename file
				
				log.info("rename file {} to {}", originalName, newName);
				for (Entry<String, List<File>> entry : flay.getFiles().entrySet()) {
					String key = entry.getKey();
					List<File> files = new ArrayList<>();
					for (File file : entry.getValue()) {
						File newFile = renameFlayFile(file, newName);
						files.add(newFile);
					}
					flay.getFiles().put(key, files);
				}
			}
		}
	}

	private File renameFlayFile(File file, String newFilename) {
		String name = FilenameUtils.getBaseName(file.getName());
		String tail = StringUtils.substringAfterLast(name, "]");
		String suffix = FilenameUtils.getExtension(file.getName());
		File dest = new File(file.getParentFile(), newFilename + tail + "." + suffix);
		boolean renameTo = file.renameTo(dest);
		log.info("renameTo {}, {} - {}", renameTo, file, dest);
		return dest;
	}

}
