package jk.kamoru.flayground.image.source;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.image.ImageNotfoundException;
import jk.kamoru.flayground.image.domain.Image;
import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class LocalImageSource implements ImageSource<Image> {

	@Value("${path.image.storage}")
	String[] imagePaths;

	private List<Image> imageList = new ArrayList<>();

	@PostConstruct
	private synchronized void load() {
		for (String path : imagePaths) {
			File dir = new File(path);
			if (dir.isDirectory()) {
				log.info("Image scanning ... {}", dir);
				for (File file : FileUtils.listFiles(dir, null, true)) {
					imageList.add(new Image(file));
				}
			}
		}
		log.info("[Image] {} loaded", size());
	}

	@Override
	public List<Image> getList() {
		return imageList;
	}

	@Override
	public Image get(int idx) {
		if (-1 < idx && idx < imageList.size())
			return imageList.get(idx);
		else 
			throw new ImageNotfoundException(idx);
	}

	@Override
	public int size() {
		return imageList.size();
	}

	@Override
	public void delete(int idx) {
		delete(get(idx));
	}

	private void delete(Image image) {
		imageList.remove(image);
		FileUtils.deleteQuietly(image.getFile());
	}

}
