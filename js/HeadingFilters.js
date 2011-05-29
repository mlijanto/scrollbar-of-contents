function HeadingFilters()
{
	this.filterHeading = function( currentHeading )
	{
		var headingText = currentHeading.innerText.toLowerCase();
		var locationHost = location.host;
		var markHeading, filteredHeadingText;
					
		if( headingText == "" )
		{
			// Don't create marker for empty headings
					
			markHeading = false;
		}
		else if( locationHost.indexOf( "wikipedia.org" ) != -1 )
		{
			// Remove "[Edit]" and its equivalent in other languages in wikipedia headings
					
			var newHeadingText = headingText.replace( /\[\w*\]/, "" );
			filteredHeadingText = newHeadingText;
			
			markHeading = true;
		}
		else if( locationHost.indexOf( "yahoo" ) != -1 )
		{
			if( currentHeading.getAttribute( "class" ) )
			{
				if( currentHeading.getAttribute( "class" ).indexOf( "oops" ) != -1 )
					markHeading = false;
				else if( currentHeading.getAttribute( "class" ).indexOf( "y-ftr-txt-hdr" ) != -1 )
					markHeading = false;
				else if( currentHeading.getAttribute( "class" ).indexOf( "title-date" ) != -1 )
					markHeading = false;
				else if( currentHeading.getAttribute( "class" ).indexOf( "y-txt-1" ) != -1 && currentHeading.getAttribute( "class" ).indexOf( "title" ) != -1 )
					markHeading = false;
				else if( currentHeading.getAttribute( "class" ).indexOf( "y-txt-5" ) != -1 && currentHeading.getAttribute( "class" ).indexOf( "alt-title" ) != -1 )
					markHeading = false;
				/* replaced by a more specific condition below
				else if( currentHeading.getAttribute( "class" ).indexOf( "y-txt-modhdr" ) )
					markHeading = false;*/
				else if( currentHeading.getAttribute( "class" ).indexOf( "y-txt-modhdr" ) != -1 && currentHeading.getElementsByTagName( "div" )[ 0 ] != undefined )
					markHeading = false;
				else if( currentHeading.getAttribute( "id" ) )
				{
					if( currentHeading.getAttribute( "id" ).indexOf( "u_2588582-p-lbl" ) != -1 )
						markHeading = false;
					else
					{
						filteredHeadingText = headingText;
						markHeading = true;
					}
				}
				else
				{
					filteredHeadingText = headingText;
					markHeading = true;
				}
			}
			else
			{
				filteredHeadingText = headingText;
				markHeading = true;
			}
		}
		else
		{	
			filteredHeadingText = headingText;
			markHeading = true;
		}
		
		return { markHeading: markHeading, filteredHeadingText: filteredHeadingText };
	}
}