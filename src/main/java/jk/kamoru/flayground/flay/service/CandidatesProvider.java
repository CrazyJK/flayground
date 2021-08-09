package jk.kamoru.flayground.flay.service;

import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;

import javax.annotation.PostConstruct;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.FlayProperties;
import jk.kamoru.flayground.Flayground;
import jk.kamoru.flayground.base.watch.DirectoryWatcher;
import jk.kamoru.flayground.flay.domain.Flay;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CandidatesProvider {

    final String[] candidatesFileSuffix = ArrayUtils.addAll(Flayground.FILE.VIDEO_SUFFIXs, Flayground.FILE.SUBTITLES_SUFFIXs);

    @Autowired FlayProperties flayProperties;

    private Collection<File> candidatesFiles;

    private Collection<File> candidatesDir;


    @PostConstruct
    public void postConstruct() {
        load();
        registWatcher();
    }

    private void registWatcher() {
        Flayground.finalTasks.add(new DirectoryWatcher(this.getClass().getSimpleName(), candidatesDir) {

            @Override
            protected void createdFile(File file) {
                if (ArrayUtils.contains(candidatesFileSuffix, FilenameUtils.getExtension(file.getName()).toLowerCase())) {
                    candidatesFiles.add(file);
                }
            }

            @Override
            protected void deletedFile(File file) {
                if (candidatesFiles.contains(file)) {
                    candidatesFiles.remove(file);
                }
            }

        });
    }

    public void load() {
        candidatesDir = Arrays.asList(flayProperties.getCandidatePath(), flayProperties.getSubtitlesPath());
        candidatesFiles = new ArrayList<>();
        for (File dir : candidatesDir) {
            Collection<File> list = FileUtils.listFiles(dir, candidatesFileSuffix, true);
            candidatesFiles.addAll(list);
            log.info(String.format("%5s file    - %s", list.size(), dir));
        }
        log.info(String.format("%5s candidates", candidatesFiles.size()));
    }

    /**
     * add cadidates Movie, Subtitles to flay
     *
     * @param flay
     * @return
     */
    public boolean matchAndFill(Flay flay) {
        final String key1 = flay.getOpus().toUpperCase();
        final String key2 = key1.replace("-", "");
        final String key3 = key1.replace("-", "00");
        boolean found = false;
        for (File file : candidatesFiles) {
            if (StringUtils.containsAny(file.getName().toUpperCase(), key1, key2, key3)) {
                flay.addCandidatesFile(file);
                found = true;
                log.debug("add candidate {} : {}", flay.getOpus(), file);
            }
        }
        return found;
    }

    public Collection<File> listFiles() {
        return candidatesFiles;
    }

}
