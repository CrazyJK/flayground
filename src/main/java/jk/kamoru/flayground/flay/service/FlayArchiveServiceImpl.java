package jk.kamoru.flayground.flay.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.FlayNotfoundException;
import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.source.FlaySource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class FlayArchiveServiceImpl implements FlayArchiveService {

	@Autowired FlaySource instanceFlaySource;
	@Autowired FlaySource archiveFlaySource;

	@Override
	public Flay get(String opus) {
		try {
			return instanceFlaySource.get(opus);
		} catch (FlayNotfoundException e) {
			return archiveFlaySource.get(opus);
		}
	}

	@Override
	public Page<Flay> page(Pageable pageable, String keyword) {
		Collection<Flay> instanceList = instanceFlaySource.list().stream().filter(f -> StringUtils.containsIgnoreCase(f.getFullname(), keyword)).collect(Collectors.toList());
		Collection<Flay>  archiveList =  archiveFlaySource.list().stream().filter(f -> StringUtils.containsIgnoreCase(f.getFullname(), keyword)).collect(Collectors.toList());
		
		List<Flay> list = new ArrayList<>();
		list.addAll(instanceList);
		list.addAll(archiveList);
		
		log.info("[page] instance: {}, archive: {}, pageable {}", instanceList.size(), archiveList.size(), pageable);
		
		long total = list.size();
		long skip = pageable.getPageNumber() * pageable.getPageSize();
		long maxSize = pageable.getPageSize();
		return new PageImpl<>(
				list.stream().sorted((f1, f2) -> StringUtils.compare(f2.getRelease(), f1.getRelease())).skip(skip).limit(maxSize).collect(Collectors.toList()),
				pageable,
				total
		);
	}

}
