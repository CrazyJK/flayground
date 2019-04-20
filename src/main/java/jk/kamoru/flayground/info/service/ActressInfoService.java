package jk.kamoru.flayground.info.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import jk.kamoru.flayground.flay.domain.Flay;
import jk.kamoru.flayground.flay.service.FlayFileHandler;
import jk.kamoru.flayground.flay.service.FlayService;
import jk.kamoru.flayground.info.InfoNotfoundException;
import jk.kamoru.flayground.info.domain.Actress;
import jk.kamoru.flayground.info.service.NameDistanceChecker.CheckResult;
import jk.kamoru.flayground.web.socket.notice.AnnounceService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ActressInfoService extends InfoServiceAdapter<Actress, String> {

	@Autowired FlayService flayService;
	@Autowired AnnounceService notificationService;
	@Autowired FlayFileHandler flayFileHandler;

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
			Collection<Flay> flayListByActress = flayService.findByKeyValue("actress", oldName);
			log.info("{} found {}", oldName, flayListByActress.size());

			for (Flay flay : flayListByActress) {
				// replace name
				List<String> actressList = flay.getActressList();
				actressList.remove(oldName);
				actressList.add(actress.getName());

				flayFileHandler.rename(flay, actressList);
			}
			notificationService.announce("Rename Actress", oldName + " -> " + actress.getName());
		}
	}

	public Collection<Actress> findByLocalname(String localname) {
		return super.infoSource.list().stream().filter(a -> StringUtils.equals(a.getLocalName(), localname)).collect(Collectors.toList());
	}

	public List<CheckResult> funcNameCheck(double limit) {
		// filter having flay
		List<String> actressList = new ArrayList<>();
		for (Flay flay : flayService.list()) {
			actressList.addAll(flay.getActressList());
		}
		List<Actress> distinctCollectedActressList = actressList.stream().distinct().map(a -> super.get(a)).collect(Collectors.toList());

		return NameDistanceChecker.check(distinctCollectedActressList, limit);
	}

	public void persist(Actress actress) {
		try {
			super.get(actress.getKey());
			super.update(actress);
		} catch(InfoNotfoundException e) {
			super.create(actress);
		}
	}

}
