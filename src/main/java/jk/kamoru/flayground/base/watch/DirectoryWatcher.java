package jk.kamoru.flayground.base.watch;

import static java.nio.file.StandardWatchEventKinds.ENTRY_CREATE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_DELETE;
import static java.nio.file.StandardWatchEventKinds.ENTRY_MODIFY;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.WatchEvent;
import java.nio.file.WatchEvent.Kind;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.HashMap;
import java.util.Map;

import lombok.extern.slf4j.Slf4j;

/**
 * Directory watcher<br>
 * need to override {@link #action(Kind, Path)}
 * <pre>
 * about Exception, user limit of inotify watches reached
 * Case Ubuntu
 * 1. Add the following line to a new file under /etc/sysctl.d/ directory: 
 *   fs.inotify.max_user_watches = 524288
 * 2. read README in /etc/sysctl.d/
 *   sudo service procps start
 * @author kamoru
 *
 */
@Slf4j
public abstract class DirectoryWatcher implements Runnable {

	private WatchService watcher;
	private Map<WatchKey, Path> keys;
	private String taskName;
	private String[] paths;
	
	// override
	protected void  createdFile(File file) {}
	protected void  deletedFile(File file) {}
	protected void modifiedFile(File file) {}

	protected void  createdDirectory(File dir) {}
	protected void  deletedDirectory(File dir) {}
	protected void modifiedDirectory(File dir) {}

	/**
	 * @param taskName task name
	 * @param paths directory to watched
	 */
	public DirectoryWatcher(String taskName, String... paths) {
		this.taskName = taskName;
		this.paths = paths;
		log.info("{} DirectoryWatcher init", taskName);
	}

	@Override
	public void run() {
		try {
			watcher = FileSystems.getDefault().newWatchService();
			keys = new HashMap<>();
			for (String path : paths) {
				walkAndRegisterDirectories(Paths.get(path));
			}
			processEvents();
		} catch (IOException | InterruptedException e) {
			log.error("Fail to watcher run", e);
		} finally {
			try {
				watcher.close();
			} catch (IOException e) {
				log.error("fail to watcher close", e);
			}
		}
	}

	/**
	 * Register the given directory, and all its sub-directories, with the WatchService.
	 * @throws IOException 
	 */
	private void walkAndRegisterDirectories(final Path start) throws IOException {
		// register directory and sub-directories
		Files.walkFileTree(start, new SimpleFileVisitor<Path>() {
			@Override
			public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
				registerDirectory(dir);
				return FileVisitResult.CONTINUE;
			}
		});
	}

	/**
	 * Register the given directory with the WatchService; 
	 * This function will be called by FileVisitor
	 * @throws IOException 
	 */
	private void registerDirectory(Path dir) throws IOException {
		WatchKey key = dir.register(watcher, ENTRY_CREATE, ENTRY_DELETE);
		keys.put(key, dir);
		log.info("{} watch : {}", taskName, dir);
	}

	private void processEvents() throws InterruptedException, IOException {
		for (;;) {
			// wait for key to be signalled
			WatchKey key = watcher.take();

			Path dir = keys.get(key);
			if (dir == null) {
				log.error("WatchKey not recognized!!");
				continue;
			}

			for (WatchEvent<?> event : key.pollEvents()) {
				@SuppressWarnings("unchecked")
				WatchEvent<Path> pathEvent = (WatchEvent<Path>) event;
				
				Kind<Path> kind = pathEvent.kind();
				Path file = pathEvent.context();
				Path child = dir.resolve(file);
				boolean directory = Files.isDirectory(child);

				// print out event
				log.debug("{} {}:{} - {}", taskName, kind.name(), directory ? "D" : "F", child);

				if (kind == ENTRY_CREATE) {
					if (directory) {
						// if directory is created, and watching recursively, then register it and its sub-directories
						walkAndRegisterDirectories(child);
						createdDirectory(child.toFile());
					} else {
						createdFile(child.toFile());
					}
				}
				else if (kind == ENTRY_DELETE) {
					if (directory)
						deletedDirectory(child.toFile());
					else
						deletedFile(child.toFile());
				}
				else if (kind == ENTRY_MODIFY) {
					if (directory)
						modifiedDirectory(child.toFile());
					else
						modifiedFile(child.toFile());
				}
			}

			// reset key and remove from set if directory no longer accessible
			boolean valid = key.reset();
			if (!valid) {
				Path removed = keys.remove(key);
				log.warn("{} watchkey reset fail. remove this {}:{}. watching {} dir", taskName, key, removed, keys.size());

				// all directories are inaccessible
				if (keys.isEmpty()) {
					log.warn("{} all directories are inaccessible", taskName);
					break;
				}
			}
		}
	}

}
