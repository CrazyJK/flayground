package jk.kamoru.flayground.image.source;

import java.io.File;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Repository;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.watch.DirectoryWatcher;
import jk.kamoru.flayground.base.web.socket.notice.AnnounceService;
import jk.kamoru.flayground.flay.service.FlayFileHandler;
import jk.kamoru.flayground.image.ImageNotfoundException;
import jk.kamoru.flayground.image.domain.Image;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Repository
public class LocalImageSource implements ImageSource {

	@Autowired FlayProperties flayProperties;

	@Autowired AnnounceService notificationService;
	@Autowired FlayFileHandler flayFileHandler;

	private List<Image> imageList;
	private boolean changed = false;

	@PostConstruct
	@CacheEvict(cacheNames = {"bannerCache"}, allEntries = true)
	private synchronized void load() {
		AtomicInteger indexCounter = new AtomicInteger(0);
		imageList = new ArrayList<>();
		for (File dir : flayProperties.getImagePaths()) {
			if (dir.isDirectory()) {
				Collection<File> listFiles = FileUtils.listFiles(dir, null, true);
				log.info(String.format("%5s file    - %s", listFiles.size(), dir));
				for (File file : listFiles) {
					if (Flayground.FILE.isImage(file)) {
						imageList.add(indexCounter.get(), new Image(file, indexCounter.getAndIncrement()));
					}
				}
			}
		}
		log.info(String.format("%5s Image", size()));

		if (!changed)
			startWatcher();
	}

	@Override
	public List<Image> list() {
		return imageList;
	}

	@Override
	public Image get(int idx) {
		if (-1 < idx && idx < size())
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
		flayFileHandler.deleteFile(image.getFile());
		notificationService.announce("Image move to root", image.getFile().toString());
	}

	private void startWatcher() {
		ExecutorService service = Executors.newSingleThreadExecutor();
		Runnable watcher = new DirectoryWatcher(this.getClass().getSimpleName(), flayProperties.getImagePaths()) {

			@Override
			protected void createdFile(File file) {
				changed = Flayground.FILE.isImage(file);
			}

			@Override
			protected void deletedFile(File file) {
				changed = Flayground.FILE.isImage(file);
			}

			@Override
			protected void modifiedFile(File file) {
				changed = Flayground.FILE.isImage(file);
			}

		};
		service.execute(watcher);
	}

	@Scheduled(fixedRate = 1000 * 30)
	protected void checkChangedAndReload() {
		if (changed) {
			log.info("Image was changed, Source will be reloaded");
			load();
			notificationService.announce("Image reload", size() + " images");
		}
		changed = false;
	}

}
